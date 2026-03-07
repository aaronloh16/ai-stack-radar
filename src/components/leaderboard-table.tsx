"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { ArrowUpRight, Star, TrendingUp } from "lucide-react";

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
  overallScore: number;
  lastUpdated: string | null;
}

export function LeaderboardTable({ initialTools }: { initialTools: Tool[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tools] = useState(initialTools);

  const filteredTools = selectedCategory
    ? tools.filter((t) => t.category === selectedCategory)
    : tools;

  // Get unique categories that actually have tools
  const activeCategories = Array.from(new Set(tools.map((t) => t.category))).sort(
    (a, b) => {
      const aLabel = CATEGORIES[a] || a;
      const bLabel = CATEGORIES[b] || b;
      return aLabel.localeCompare(bLabel);
    }
  );

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-white text-zinc-900"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All
        </button>
        {activeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {CATEGORIES[cat] || cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                #
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Tool
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                Category
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <span className="flex items-center justify-end gap-1">
                  <Star className="w-3 h-3" /> Stars
                </span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <TrendingUp className="w-3 h-3" /> Velocity
                </span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                HN 7d
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map((tool, index) => (
              <tr
                key={tool.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-zinc-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://github.com/${tool.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-100 hover:text-white flex items-center gap-1"
                      >
                        {tool.name}
                        <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                      </a>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 max-w-md truncate">
                      {tool.description}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400">
                    {CATEGORIES[tool.category] || tool.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-300 tabular-nums">
                  {tool.stars.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm hidden sm:table-cell tabular-nums">
                  <span
                    className={
                      tool.starVelocity > 0 ? "text-emerald-400" : "text-zinc-500"
                    }
                  >
                    +{tool.starVelocity.toFixed(1)}/d
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-400 hidden lg:table-cell tabular-nums">
                  {tool.hnMentions7d > 0 ? (
                    <span>
                      {tool.hnMentions7d} ({tool.hnPoints7d}pts)
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {tool.overallScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No tools found for this category.
        </div>
      )}
    </div>
  );
}
