import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tools, momentumScores, githubSnapshots } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  try {
    const allTools = await db.select().from(tools);

    const leaderboard = await Promise.all(
      allTools
        .filter((t) => !category || t.category === category)
        .map(async (tool) => {
          // Get latest momentum score
          const [latestScore] = await db
            .select()
            .from(momentumScores)
            .where(eq(momentumScores.toolId, tool.id))
            .orderBy(desc(momentumScores.calculatedAt))
            .limit(1);

          // Get latest GitHub snapshot for star count
          const [latestGH] = await db
            .select()
            .from(githubSnapshots)
            .where(eq(githubSnapshots.toolId, tool.id))
            .orderBy(desc(githubSnapshots.collectedAt))
            .limit(1);

          return {
            id: tool.id,
            name: tool.name,
            repo: tool.repo,
            category: tool.category,
            description: tool.description,
            website: tool.website,
            stars: latestGH?.stars ?? 0,
            forks: latestGH?.forks ?? 0,
            starVelocity: latestScore?.starVelocity ?? 0,
            hnMentions7d: latestScore?.hnMentions7d ?? 0,
            hnPoints7d: latestScore?.hnPoints7d ?? 0,
            overallScore: latestScore?.overallScore ?? 0,
            lastUpdated: latestScore?.calculatedAt ?? null,
          };
        })
    );

    // Sort by overall score descending
    leaderboard.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ tools: leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
