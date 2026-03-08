import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import { tools, githubSnapshots, momentumScores } from "../src/lib/schema";
import toolsData from "../src/data/tools.json";
import {
  calculateStarVelocity,
  estimateInitialVelocity,
  roundScore,
} from "../src/lib/scoring";

const DATABASE_URL = process.env.DATABASE_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
}

async function fetchGitHubRepo(repo: string): Promise<GitHubRepo | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ai-stack-radar",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    console.error(
      `Failed to fetch ${repo}: ${res.status} (rate limit remaining: ${remaining})`
    );
    return null;
  }

  return res.json() as Promise<GitHubRepo>;
}

async function seedToolsIfNeeded() {
  const existing = await db.select({ id: tools.id }).from(tools);
  if (existing.length > 0) {
    console.log(`Tools table already has ${existing.length} entries, skipping seed.`);
    return;
  }

  console.log(`Seeding ${toolsData.length} tools...`);
  for (const tool of toolsData) {
    await db.insert(tools).values({
      name: tool.name,
      repo: tool.repo,
      category: tool.category,
      description: tool.description,
      website: tool.website,
      hnSearchTerms: tool.hn_search_terms,
    });
  }
  console.log("Seeding complete.");
}

async function collectGitHubData() {
  await seedToolsIfNeeded();

  const allTools = await db.select().from(tools);
  console.log(`Collecting GitHub data for ${allTools.length} tools...`);

  let success = 0;
  let failed = 0;

  for (const tool of allTools) {
    const data = await fetchGitHubRepo(tool.repo);
    if (!data) {
      failed++;
      continue;
    }

    await db.insert(githubSnapshots).values({
      toolId: tool.id,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      watchers: data.subscribers_count,
    });

    success++;
    console.log(`  ${tool.name}: ${data.stargazers_count.toLocaleString()} stars`);

    // Rate limiting: 100ms delay between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

async function calculateMomentumScores() {
  const allTools = await db.select().from(tools);
  console.log(`\nCalculating momentum scores...`);

  for (const tool of allTools) {
    // Get latest two snapshots to calculate velocity (desc = newest first)
    const snapshots = await db
      .select()
      .from(githubSnapshots)
      .where(eq(githubSnapshots.toolId, tool.id))
      .orderBy(desc(githubSnapshots.collectedAt))
      .limit(2);

    if (snapshots.length < 1) continue;

    let starVelocity = 0;

    if (snapshots.length === 2) {
      const newer = snapshots[0];
      const older = snapshots[1];
      const timeDiffMs =
        new Date(newer.collectedAt).getTime() - new Date(older.collectedAt).getTime();
      starVelocity = calculateStarVelocity(newer.stars, older.stars, timeDiffMs);
    }

    if (snapshots.length === 1) {
      starVelocity = estimateInitialVelocity(snapshots[0].stars);
    }

    const overallScore = starVelocity;

    await db.insert(momentumScores).values({
      toolId: tool.id,
      starVelocity: roundScore(starVelocity),
      hnMentions7d: 0,
      hnPoints7d: 0,
      npmDownloads7d: 0,
      pypiDownloads7d: 0,
      overallScore: roundScore(overallScore),
    });

    console.log(
      `  ${tool.name}: velocity=${starVelocity.toFixed(1)} stars/day, score=${overallScore.toFixed(1)}`
    );
  }
}

async function main() {
  try {
    await collectGitHubData();
    await calculateMomentumScores();
  } catch (err) {
    console.error("Collection failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
