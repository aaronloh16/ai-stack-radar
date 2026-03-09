import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import { tools, hnSnapshots, momentumScores } from "../src/lib/schema";
import { calculateHNBoost, calculateOverallScore, roundScore } from "../src/lib/scoring";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

interface HNSearchResult {
  hits: Array<{
    title: string;
    url: string;
    points: number;
    num_comments: number;
    objectID: string;
    created_at: string;
  }>;
  nbHits: number;
}

async function searchHN(query: string, numericFilters: string): Promise<HNSearchResult> {
  const params = new URLSearchParams({
    query,
    tags: "story",
    numericFilters,
    hitsPerPage: "100",
  });

  const res = await fetch(`https://hn.algolia.com/api/v1/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`HN API error: ${res.status}`);
  }

  return res.json() as Promise<HNSearchResult>;
}

async function collectHNData() {
  const allTools = await db.select().from(tools);
  console.log(`Collecting HN data for ${allTools.length} tools...`);

  // Search for mentions in the last 7 days
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const numericFilters = `created_at_i>${sevenDaysAgo}`;

  let success = 0;

  for (const tool of allTools) {
    const searchTerms = (tool.hnSearchTerms as string[]) || [];
    if (searchTerms.length === 0) continue;

    let totalMentions = 0;
    let totalPoints = 0;
    let totalComments = 0;
    let topStoryUrl: string | null = null;
    let topStoryPoints = 0;
    const seenIds = new Set<string>();

    for (const term of searchTerms) {
      try {
        const result = await searchHN(term, numericFilters);

        for (const hit of result.hits) {
          // Deduplicate across search terms by objectID
          if (seenIds.has(hit.objectID)) continue;
          seenIds.add(hit.objectID);

          totalMentions++;
          totalPoints += hit.points || 0;
          totalComments += hit.num_comments || 0;

          if ((hit.points || 0) > topStoryPoints) {
            topStoryPoints = hit.points || 0;
            topStoryUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
          }
        }
      } catch (err) {
        console.error(`  Error searching HN for "${term}":`, err);
      }

      // Algolia rate limit: 10,000 requests/hour, but be polite
      await new Promise((r) => setTimeout(r, 200));
    }

    await db.insert(hnSnapshots).values({
      toolId: tool.id,
      mentionCount: totalMentions,
      totalPoints,
      totalComments,
      topStoryUrl,
    });

    if (totalMentions > 0) {
      console.log(`  ${tool.name}: ${totalMentions} mentions, ${totalPoints} points`);
    }

    success++;
  }

  console.log(`\nHN collection done. ${success} tools processed.`);
}

async function updateMomentumWithHN() {
  console.log(`\nUpdating momentum scores with HN data...`);

  const allTools = await db.select().from(tools);

  for (const tool of allTools) {
    // Get latest HN snapshot
    const [latestHN] = await db
      .select()
      .from(hnSnapshots)
      .where(eq(hnSnapshots.toolId, tool.id))
      .orderBy(desc(hnSnapshots.collectedAt))
      .limit(1);

    if (!latestHN) continue;

    // Get latest momentum score
    const [latestMomentum] = await db
      .select()
      .from(momentumScores)
      .where(eq(momentumScores.toolId, tool.id))
      .orderBy(desc(momentumScores.calculatedAt))
      .limit(1);

    if (!latestMomentum) continue;

    const hnBoost = calculateHNBoost(latestHN.totalPoints, latestHN.mentionCount);
    const downloadBoost =
      (latestMomentum.npmDownloads7d + latestMomentum.pypiDownloads7d) / 1000;
    const overallScore = calculateOverallScore(
      latestMomentum.starVelocity,
      hnBoost + downloadBoost
    );

    await db.insert(momentumScores).values({
      toolId: tool.id,
      starVelocity: latestMomentum.starVelocity,
      hnMentions7d: latestHN.mentionCount,
      hnPoints7d: latestHN.totalPoints,
      npmDownloads7d: latestMomentum.npmDownloads7d,
      pypiDownloads7d: latestMomentum.pypiDownloads7d,
      overallScore: roundScore(overallScore),
    });

    if (hnBoost > 0) {
      console.log(
        `  ${tool.name}: hn_boost=+${hnBoost.toFixed(1)}, total=${overallScore.toFixed(1)}`
      );
    }
  }
}

async function main() {
  try {
    await collectHNData();
    await updateMomentumWithHN();
  } catch (err) {
    console.error("HN collection failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
