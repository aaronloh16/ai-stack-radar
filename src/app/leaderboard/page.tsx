import type { Metadata } from "next";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";
import { EssentialsView } from "@/components/essentials-view";
import { WeeklySummaryCard } from "@/components/weekly-summary";
import { Trophy, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}): Promise<Metadata> {
  const { view } = await searchParams;
  if (view === "momentum") {
    return {
      title: "Momentum Leaderboard | DevFlow",
      description: "AI dev tools ranked by real developer sentiment. Updated daily.",
    };
  }
  return {
    title: "Developer Essentials | DevFlow",
    description: "Curated AI dev tools organized by use case with tier ratings.",
  };
}

async function getLeaderboardData() {
  try {
    const { db } = await import("@/lib/db");
    const { tools, momentumScores, githubSnapshots } = await import("@/lib/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allTools = await db.select().from(tools);

    const leaderboard = await Promise.all(
      allTools.map(async (tool) => {
        const [latestScore] = await db
          .select()
          .from(momentumScores)
          .where(eq(momentumScores.toolId, tool.id))
          .orderBy(desc(momentumScores.calculatedAt))
          .limit(1);

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
          npmDownloads7d: latestScore?.npmDownloads7d ?? 0,
          pypiDownloads7d: latestScore?.pypiDownloads7d ?? 0,
          overallScore: latestScore?.overallScore ?? 0,
          lastUpdated: latestScore?.calculatedAt?.toISOString() ?? null,
        };
      })
    );

    leaderboard.sort((a, b) => b.overallScore - a.overallScore);
    return leaderboard;
  } catch {
    return [];
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeView = view === "momentum" ? "momentum" : "essentials";

  const tools = activeView === "momentum" ? await getLeaderboardData() : [];

  let weeklySummary = null;
  if (activeView === "momentum" && tools.length > 0) {
    try {
      const { getWeeklySummaryData } = await import("@/lib/queries");
      weeklySummary = await getWeeklySummaryData();
    } catch {
      // Summary is non-critical, page works without it
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={
              activeView === "momentum"
                ? {
                    background: "rgba(251,191,36,0.1)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }
                : {
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }
            }
          >
            {activeView === "momentum" ? (
              <Trophy className="w-4.5 h-4.5" style={{ color: "#fbbf24" }} />
            ) : (
              <BookOpen className="w-4.5 h-4.5" style={{ color: "#6366f1" }} />
            )}
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            {activeView === "momentum" ? "Momentum Leaderboard" : "Developer Essentials"}
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {activeView === "momentum"
            ? "AI dev tools ranked by real developer sentiment. Updated daily."
            : "Curated picks for every stage of AI development, organized by use case."}
        </p>
      </div>

      <div className="mb-6 animate-fade-in-up delay-50">
        <LeaderboardTabs activeView={activeView} />
      </div>

      {activeView === "momentum" ? (
        tools.length > 0 ? (
          <>
            {weeklySummary && (
              <div className="animate-fade-in-up delay-100">
                <WeeklySummaryCard data={weeklySummary} />
              </div>
            )}
            <div className="animate-fade-in-up delay-200">
              <LeaderboardTable initialTools={tools} />
            </div>
          </>
        ) : (
          <div className="text-center py-24" style={{ color: "var(--text-tertiary)" }}>
            <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>
              No data yet
            </p>
            <p className="text-sm">
              Run{" "}
              <code
                className="px-2 py-0.5 rounded-lg text-xs"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--accent-cyan)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                npm run collect:github
              </code>{" "}
              to seed the leaderboard.
            </p>
          </div>
        )
      ) : (
        <div className="animate-fade-in-up delay-100">
          <EssentialsView />
        </div>
      )}
    </div>
  );
}
