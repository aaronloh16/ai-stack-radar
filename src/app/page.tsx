import Link from "next/link";
import { Trophy, Sparkles, TrendingUp, ArrowUpRight, Star, Radio, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface TopMover {
  name: string;
  repo: string;
  stars: number;
  starVelocity: number;
  overallScore: number;
}

async function getTopMovers(): Promise<TopMover[]> {
  try {
    const { db } = await import("@/lib/db");
    const { tools, momentumScores, githubSnapshots } = await import("@/lib/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allTools = await db.select().from(tools);

    const toolsWithScores = await Promise.all(
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
          name: tool.name,
          repo: tool.repo,
          stars: latestGH?.stars ?? 0,
          starVelocity: latestScore?.starVelocity ?? 0,
          overallScore: latestScore?.overallScore ?? 0,
        };
      })
    );

    toolsWithScores.sort((a, b) => b.overallScore - a.overallScore);
    return toolsWithScores.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function Home() {
  const topMovers = await getTopMovers();

  return (
    <div className="relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 bg-dot-grid pointer-events-none"
        style={{ opacity: 0.4 }}
      />

      {/* Radial fade-out over dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, transparent 0%, var(--bg-base) 70%)",
        }}
      />

      {/* Hero glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 relative">
        {/* Hero */}
        <div className="text-center space-y-6 mb-24 animate-fade-in-up">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <span className="live-dot" />
            <span>Updated daily from GitHub &amp; Hacker News</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
            style={{ fontFamily: "var(--font-syne), sans-serif", letterSpacing: "-0.03em" }}
          >
            What developers are
            <br />
            <span style={{ color: "var(--accent-cyan)" }} className="text-glow-cyan">
              actually using
            </span>
          </h1>

          <p className="text-lg max-w-lg mx-auto leading-relaxed delay-100 animate-fade-in-up" style={{ color: "var(--text-secondary)" }}>
            AI dev tool rankings backed by live sentiment data. See what&rsquo;s
            gaining momentum, then generate an architecture that uses it.
          </p>

          <div className="flex gap-3 justify-center pt-2 delay-200 animate-fade-in-up">
            <Link
              href="/leaderboard"
              className="group btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
            >
              View Leaderboard
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/generate"
              className="btn-ghost px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
            >
              Generate a Stack
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-20 delay-300 animate-fade-in-up">
          {/* Leaderboard card */}
          <Link href="/leaderboard" className="group block">
            <div className="card p-6 h-full hover:scale-[1.01] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent-amber-dim)", border: "1px solid rgba(251,191,36,0.2)" }}
                >
                  <Trophy className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      Momentum Leaderboard
                    </h2>
                    <ArrowUpRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                    Ranks 60+ AI dev tools by GitHub star velocity and Hacker News activity.
                    Open-source scoring — no black boxes.
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> Star velocity
                    </span>
                    <span>·</span>
                    <span>HN mentions</span>
                    <span>·</span>
                    <span>Daily updates</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Generator card */}
          <Link href="/generate" className="group block">
            <div className="card p-6 h-full hover:scale-[1.01] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent-violet-dim)", border: "1px solid rgba(167,139,250,0.2)" }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "var(--accent-violet)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      Architecture Generator
                    </h2>
                    <ArrowUpRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                    Describe what you want to build. Get a recommended stack, Mermaid
                    diagram, and step-by-step build plan — powered by live data.
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" /> Claude-powered
                    </span>
                    <span>·</span>
                    <span>Diagrams</span>
                    <span>·</span>
                    <span>Shareable</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Top Movers preview */}
        {topMovers.length > 0 && (
          <div className="delay-400 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="live-dot" />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.12em" }}
                >
                  Top Movers
                </span>
              </div>
              <Link
                href="/leaderboard"
                className="hover-text-secondary text-xs flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest w-12" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      #
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      Tool
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      Stars
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest hidden sm:table-cell" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      Velocity
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topMovers.map((tool, i) => (
                    <tr
                      key={tool.repo}
                      className={`home-table-row transition-colors ${i === 0 ? "row-rank-1" : i === 1 ? "row-rank-2" : i === 2 ? "row-rank-3" : ""}`}
                      style={{ borderBottom: i < topMovers.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    >
                      <td className="px-5 py-3.5">
                        {i === 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold" style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)", border: "1px solid rgba(251,191,36,0.2)" }}>1</span>
                        ) : i === 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold" style={{ background: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.15)" }}>2</span>
                        ) : i === 2 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold" style={{ background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" }}>3</span>
                        ) : (
                          <span className="text-xs font-mono pl-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{i + 1}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={`https://github.com/${tool.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium inline-flex items-center gap-1.5 group/link"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        {tool.stars.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm hidden sm:table-cell tabular-nums" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        <span style={{ color: tool.starVelocity > 0 ? "var(--accent-green)" : tool.starVelocity < 0 ? "var(--accent-red)" : "var(--text-tertiary)" }}>
                          <span className="flex items-center justify-end gap-1">
                            {tool.starVelocity > 0 && <Zap className="w-3 h-3" />}
                            {tool.starVelocity >= 0 ? "+" : ""}
                            {tool.starVelocity.toFixed(1)}/d
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                          {tool.overallScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-16 pb-4">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Open-source scoring algorithm · Built in public ·{" "}
            <a
              href="https://github.com/aaronloh16/ai-stack-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-text-secondary"
            >
              View source
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
