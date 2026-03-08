"use client";

import { useState, useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import {
  ArrowUpRight,
  Star,
  TrendingUp,
  Download,
  ChevronUp,
  ChevronDown,
  Search,
  Zap,
} from "lucide-react";

interface Tool {
  id: number;
  name: string;
  repo: string;
  category: string;
  description: string | null;
  website: string | null;
  stars: number;
  forks: number;
  starVelocity: number;
  hnMentions7d: number;
  hnPoints7d: number;
  npmDownloads7d: number;
  pypiDownloads7d: number;
  overallScore: number;
  lastUpdated: string | null;
}

type SortKey = "stars" | "starVelocity" | "hnPoints7d" | "downloads7d" | "overallScore";
type SortDir = "asc" | "desc";

export function LeaderboardTable({ initialTools }: { initialTools: Tool[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filteredTools = useMemo(() => {
    let result = initialTools;

    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortKey === "downloads7d") {
        const aVal = a.npmDownloads7d + a.pypiDownloads7d;
        const bVal = b.npmDownloads7d + b.pypiDownloads7d;
        return (aVal - bVal) * mul;
      }
      return (a[sortKey] - b[sortKey]) * mul;
    });

    return result;
  }, [initialTools, selectedCategory, search, sortKey, sortDir]);

  const activeCategories = useMemo(
    () =>
      Array.from(new Set(initialTools.map((t) => t.category))).sort((a, b) => {
        const aLabel = CATEGORIES[a] || a;
        const bLabel = CATEGORIES[b] || b;
        return aLabel.localeCompare(bLabel);
      }),
    [initialTools]
  );

  function sortIcon(column: SortKey) {
    if (sortKey !== column) return <ChevronDown className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />;
    return sortDir === "desc" ? (
      <ChevronDown className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
    ) : (
      <ChevronUp className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
    );
  }

  const maxScore = filteredTools[0]?.overallScore || 1;

  return (
    <div>
      {/* Search + Category filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="input-base w-full pl-11 pr-4 py-3 rounded-xl text-sm"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: !selectedCategory ? "var(--accent-cyan)" : "var(--bg-surface)",
              color: !selectedCategory ? "#06060e" : "var(--text-secondary)",
              border: `1px solid ${!selectedCategory ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
              fontFamily: "var(--font-syne), sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            All
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: selectedCategory === cat ? "var(--accent-cyan)" : "var(--bg-surface)",
                color: selectedCategory === cat ? "#06060e" : "var(--text-secondary)",
                border: `1px solid ${selectedCategory === cat ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                fontFamily: "var(--font-syne), sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {CATEGORIES[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
              <th
                className="text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest w-14"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                #
              </th>
              <th
                className="text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Tool
              </th>
              <th
                className="text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest hidden md:table-cell"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Category
              </th>
              <th
                className="text-right px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors"
                style={{ color: sortKey === "stars" ? "var(--accent-cyan)" : "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => handleSort("stars")}
              >
                <span className="flex items-center justify-end gap-1">
                  <Star className="w-3 h-3" /> Stars {sortIcon("stars")}
                </span>
              </th>
              <th
                className="text-right px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest hidden sm:table-cell cursor-pointer select-none transition-colors"
                style={{ color: sortKey === "starVelocity" ? "var(--accent-cyan)" : "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => handleSort("starVelocity")}
              >
                <span className="flex items-center justify-end gap-1">
                  <TrendingUp className="w-3 h-3" /> Velocity {sortIcon("starVelocity")}
                </span>
              </th>
              <th
                className="text-right px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest hidden lg:table-cell cursor-pointer select-none transition-colors"
                style={{ color: sortKey === "hnPoints7d" ? "var(--accent-cyan)" : "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => handleSort("hnPoints7d")}
              >
                <span className="flex items-center justify-end gap-1">
                  HN 7d {sortIcon("hnPoints7d")}
                </span>
              </th>
              <th
                className="text-right px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest hidden lg:table-cell cursor-pointer select-none transition-colors"
                style={{ color: sortKey === "downloads7d" ? "var(--accent-cyan)" : "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => handleSort("downloads7d")}
              >
                <span className="flex items-center justify-end gap-1">
                  <Download className="w-3 h-3" /> DLs 7d {sortIcon("downloads7d")}
                </span>
              </th>
              <th
                className="text-right px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors"
                style={{ color: sortKey === "overallScore" ? "var(--accent-cyan)" : "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif" }}
                onClick={() => handleSort("overallScore")}
              >
                <span className="flex items-center justify-end gap-1">
                  Score {sortIcon("overallScore")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map((tool, index) => (
              <tr
                key={tool.id}
                className={`transition-all ${index === 0 ? "row-rank-1" : index === 1 ? "row-rank-2" : index === 2 ? "row-rank-3" : ""}`}
                style={{ borderBottom: index < filteredTools.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                onMouseEnter={(e) => {
                  if (index >= 3) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                }}
                onMouseLeave={(e) => {
                  if (index >= 3) (e.currentTarget as HTMLElement).style.background = "";
                }}
              >
                {/* Rank */}
                <td className="px-5 py-4">
                  {index === 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold" style={{ background: "var(--accent-amber-dim)", color: "var(--accent-amber)", border: "1px solid rgba(251,191,36,0.2)" }}>1</span>
                  ) : index === 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold" style={{ background: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.15)" }}>2</span>
                  ) : index === 2 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold" style={{ background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" }}>3</span>
                  ) : (
                    <span className="text-xs pl-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{index + 1}</span>
                  )}
                </td>

                {/* Tool name */}
                <td className="px-5 py-4">
                  <div>
                    <a
                      href={`https://github.com/${tool.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium inline-flex items-center gap-1.5 group/link mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tool.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
                    </a>
                    {tool.description && (
                      <p className="text-xs max-w-md truncate" style={{ color: "var(--text-tertiary)" }}>
                        {tool.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="px-5 py-4 hidden md:table-cell">
                  <span
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      fontFamily: "var(--font-syne), sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {CATEGORIES[tool.category] || tool.category}
                  </span>
                </td>

                {/* Stars */}
                <td className="px-5 py-4 text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {tool.stars.toLocaleString()}
                </td>

                {/* Star velocity */}
                <td className="px-5 py-4 text-right text-sm hidden sm:table-cell tabular-nums" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  <span style={{ color: tool.starVelocity > 0 ? "var(--accent-green)" : tool.starVelocity < 0 ? "var(--accent-red)" : "var(--text-tertiary)" }}>
                    <span className="flex items-center justify-end gap-1">
                      {tool.starVelocity > 0 && <Zap className="w-3 h-3" />}
                      {tool.starVelocity >= 0 ? "+" : ""}
                      {tool.starVelocity.toFixed(1)}/d
                    </span>
                  </span>
                </td>

                {/* HN */}
                <td className="px-5 py-4 text-right text-sm hidden lg:table-cell tabular-nums" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {tool.hnMentions7d > 0 ? (
                    <span>
                      {tool.hnMentions7d}{" "}
                      <span style={{ color: "var(--text-tertiary)" }}>({tool.hnPoints7d}pts)</span>
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>

                {/* Downloads */}
                <td className="px-5 py-4 text-right text-sm hidden lg:table-cell tabular-nums" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {(tool.npmDownloads7d + tool.pypiDownloads7d) > 0 ? (
                    (tool.npmDownloads7d + tool.pypiDownloads7d).toLocaleString()
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>

                {/* Score */}
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex flex-col items-end gap-1.5">
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      {tool.overallScore.toFixed(1)}
                    </span>
                    <div className="w-16 h-[3px] rounded-full hidden sm:block" style={{ background: "var(--border-subtle)" }}>
                      <div
                        className="h-full rounded-full score-bar"
                        style={{ width: `${Math.min(100, (tool.overallScore / maxScore) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {search.trim()
            ? `No tools matching "${search}".`
            : "No tools found for this category."}
        </div>
      )}
    </div>
  );
}
