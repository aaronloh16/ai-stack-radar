import { TrendingUp, TrendingDown, Sparkles, BarChart3 } from "lucide-react";
import type { WeeklySummary } from "@/lib/queries";

export function WeeklySummaryCard({ data }: { data: WeeklySummary }) {
  const hasContent =
    data.trendingUp.length > 0 ||
    data.trendingDown.length > 0 ||
    data.newThisWeek.length > 0;

  if (!hasContent) return null;

  const title = data.hasHistoricalData ? "This Week in AI Tools" : "Top Movers";

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
          }}
        >
          <BarChart3 className="w-3.5 h-3.5" style={{ color: "var(--accent-green)" }} />
        </div>
        <h2
          className="text-sm font-semibold"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
        {data.hasHistoricalData && data.dataAge && (
          <span
            className="text-xs ml-auto"
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            vs {data.dataAge} ago
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trending Up */}
        {data.trendingUp.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-green)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent-green)" }}
              >
                {data.hasHistoricalData ? "Trending Up" : "Highest Momentum"}
              </span>
            </div>
            <div className="space-y-1.5">
              {data.trendingUp.map((tool) => (
                <a
                  key={tool.repo}
                  href={`https://github.com/${tool.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors"
                  style={{ background: "var(--accent-green-dim)" }}
                >
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tool.name}
                  </span>
                  <span
                    className="text-xs font-mono shrink-0 ml-2"
                    style={{
                      color: "var(--accent-green)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {data.hasHistoricalData
                      ? `+${tool.delta.toFixed(1)}`
                      : tool.currentScore.toFixed(1)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trending Down */}
        {data.trendingDown.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingDown
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-red)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent-red)" }}
              >
                Trending Down
              </span>
            </div>
            <div className="space-y-1.5">
              {data.trendingDown.map((tool) => (
                <a
                  key={tool.repo}
                  href={`https://github.com/${tool.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors"
                  style={{ background: "rgba(239, 68, 68, 0.06)" }}
                >
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tool.name}
                  </span>
                  <span
                    className="text-xs font-mono shrink-0 ml-2"
                    style={{
                      color: "var(--accent-red)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {tool.delta.toFixed(1)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* New This Week */}
        {data.newThisWeek.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent-amber)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent-amber)" }}
              >
                New This Week
              </span>
            </div>
            <div className="space-y-1.5">
              {data.newThisWeek.map((tool) => (
                <a
                  key={tool.repo}
                  href={`https://github.com/${tool.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors"
                  style={{ background: "var(--accent-amber-dim)" }}
                >
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tool.name}
                  </span>
                  <span
                    className="text-xs font-mono shrink-0 ml-2"
                    style={{
                      color: "var(--accent-amber)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {tool.score.toFixed(1)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
