import { db } from "./db";
import { tools, momentumScores, githubSnapshots } from "./schema";
import { desc, eq, sql } from "drizzle-orm";

// ─── Weekly Summary Types ───────────────────────────────────────────────

export type ToolDelta = {
  name: string;
  repo: string;
  category: string;
  currentScore: number;
  previousScore: number;
  delta: number;
};

export type WeeklySummary = {
  trendingUp: ToolDelta[];
  trendingDown: ToolDelta[];
  newThisWeek: { name: string; repo: string; category: string; score: number }[];
  hasHistoricalData: boolean;
  dataAge: string;
};

export type ToolWithMetrics = {
  id: number;
  name: string;
  repo: string;
  category: string;
  description: string | null;
  website: string | null;
  npmPackage: string | null;
  pypiPackage: string | null;
  stars: number;
  forks: number;
  starVelocity: number;
  hnMentions7d: number;
  hnPoints7d: number;
  npmDownloads7d: number;
  pypiDownloads7d: number;
  overallScore: number;
  lastUpdated: Date | null;
};

/**
 * Fetches all tools with their latest momentum score and GitHub snapshot.
 * Uses DISTINCT ON to get latest row per tool in a single query each,
 * replacing the N+1 pattern (121 queries → 3 queries).
 */
type ScoreRow = {
  tool_id: number;
  star_velocity: number;
  hn_mentions_7d: number;
  hn_points_7d: number;
  npm_downloads_7d: number;
  pypi_downloads_7d: number;
  overall_score: number;
  calculated_at: Date;
};

type GHRow = {
  tool_id: number;
  stars: number;
  forks: number;
};

export async function getToolsWithLatestMetrics(): Promise<ToolWithMetrics[]> {
  // Latest momentum score per tool (1 query)
  const latestScores: ScoreRow[] = await db.execute(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, star_velocity, hn_mentions_7d, hn_points_7d,
      npm_downloads_7d, pypi_downloads_7d, overall_score, calculated_at
    FROM momentum_scores
    ORDER BY tool_id, calculated_at DESC
  `);

  // Latest GitHub snapshot per tool (1 query)
  const latestGH: GHRow[] = await db.execute(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, stars, forks
    FROM github_snapshots
    ORDER BY tool_id, collected_at DESC
  `);

  // All tools (1 query)
  const allTools = await db.select().from(tools);

  // Index by toolId for O(1) lookups
  const scoresByToolId = new Map(latestScores.map((s) => [s.tool_id, s]));
  const ghByToolId = new Map(latestGH.map((g) => [g.tool_id, g]));

  return allTools.map((tool) => {
    const score = scoresByToolId.get(tool.id);
    const gh = ghByToolId.get(tool.id);

    return {
      id: tool.id,
      name: tool.name,
      repo: tool.repo,
      category: tool.category,
      description: tool.description,
      website: tool.website,
      npmPackage: tool.npmPackage,
      pypiPackage: tool.pypiPackage,
      stars: gh?.stars ?? 0,
      forks: gh?.forks ?? 0,
      starVelocity: score?.star_velocity ?? 0,
      hnMentions7d: score?.hn_mentions_7d ?? 0,
      hnPoints7d: score?.hn_points_7d ?? 0,
      npmDownloads7d: score?.npm_downloads_7d ?? 0,
      pypiDownloads7d: score?.pypi_downloads_7d ?? 0,
      overallScore: score?.overall_score ?? 0,
      lastUpdated: score?.calculated_at ?? null,
    };
  });
}

// ─── Weekly Summary Query ──────────────────────────────────────────────

type OldScoreRow = {
  tool_id: number;
  overall_score: number;
  calculated_at: Date;
};

/**
 * Computes a weekly momentum summary by comparing current scores
 * against the closest snapshot from ~7 days ago.
 */
export async function getWeeklySummaryData(): Promise<WeeklySummary> {
  const allTools = await db.select().from(tools);
  const toolMap = new Map(allTools.map((t) => [t.id, t]));

  // Latest score per tool
  const latestScores: ScoreRow[] = await db.execute(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, star_velocity, hn_mentions_7d, hn_points_7d,
      npm_downloads_7d, pypi_downloads_7d, overall_score, calculated_at
    FROM momentum_scores
    ORDER BY tool_id, calculated_at DESC
  `);

  // Scores from ~7 days ago: get the latest score per tool that is at least 6 days old
  const oldScores: OldScoreRow[] = await db.execute(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, overall_score, calculated_at
    FROM momentum_scores
    WHERE calculated_at < NOW() - INTERVAL '6 days'
    ORDER BY tool_id, calculated_at DESC
  `);

  // Tools created in the last 7 days
  const newToolRows: { id: number }[] = await db.execute(sql`
    SELECT id FROM tools
    WHERE created_at > NOW() - INTERVAL '7 days'
  `);
  const newToolIds = new Set(newToolRows.map((r) => r.id));

  const oldScoreMap = new Map(oldScores.map((s) => [s.tool_id, s.overall_score]));
  const hasHistoricalData = oldScores.length > 0;

  // Compute age of oldest comparison data
  let dataAge = "";
  if (hasHistoricalData) {
    const oldestDate = oldScores.reduce(
      (min, s) => (s.calculated_at < min ? s.calculated_at : min),
      oldScores[0].calculated_at
    );
    const days = Math.round((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    dataAge = `${days}d`;
  }

  const deltas: ToolDelta[] = [];

  for (const score of latestScores) {
    const tool = toolMap.get(score.tool_id);
    if (!tool) continue;
    if (newToolIds.has(tool.id)) continue; // exclude new tools from delta calc

    const previousScore = oldScoreMap.get(score.tool_id);
    if (previousScore === undefined) continue; // no historical data for this tool

    deltas.push({
      name: tool.name,
      repo: tool.repo,
      category: tool.category,
      currentScore: score.overall_score,
      previousScore,
      delta: Math.round((score.overall_score - previousScore) * 100) / 100,
    });
  }

  // Sort by delta descending for trending up
  const sortedUp = [...deltas]
    .filter((d) => d.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  // Sort by delta ascending for trending down
  const sortedDown = [...deltas]
    .filter((d) => d.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);

  // New this week
  const newThisWeek = latestScores
    .filter((s) => newToolIds.has(s.tool_id))
    .map((s) => {
      const tool = toolMap.get(s.tool_id)!;
      return {
        name: tool.name,
        repo: tool.repo,
        category: tool.category,
        score: s.overall_score,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Fallback: if no historical data, show top movers by current score
  if (!hasHistoricalData) {
    const topMovers = latestScores
      .map((s) => {
        const tool = toolMap.get(s.tool_id);
        if (!tool) return null;
        return {
          name: tool.name,
          repo: tool.repo,
          category: tool.category,
          currentScore: s.overall_score,
          previousScore: 0,
          delta: s.overall_score,
        };
      })
      .filter((d): d is ToolDelta => d !== null)
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5);

    return {
      trendingUp: topMovers,
      trendingDown: [],
      newThisWeek,
      hasHistoricalData: false,
      dataAge: "",
    };
  }

  return {
    trendingUp: sortedUp,
    trendingDown: sortedDown,
    newThisWeek,
    hasHistoricalData: true,
    dataAge,
  };
}
