"use client";

import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Github,
  Lightbulb,
} from "lucide-react";
import { MermaidDiagram } from "@/components/mermaid-diagram";

interface DetectedTool {
  name: string;
  category: string;
  status: "accelerating" | "stable" | "stagnating";
  momentumScore: number;
  note: string;
}

interface Suggestion {
  current: string;
  suggested: string;
  reason: string;
}

interface RepoAnalysis {
  summary: string;
  overallHealthScore: number;
  detectedTools: DetectedTool[];
  suggestions: Suggestion[];
  diagram: string;
}

function scoreStyle(score: number): { color: string; bg: string; border: string } {
  if (score >= 70) return {
    color: "var(--accent-green)",
    bg: "rgba(52,211,153,0.05)",
    border: "rgba(52,211,153,0.2)",
  };
  if (score >= 40) return {
    color: "var(--accent-amber)",
    bg: "rgba(251,191,36,0.05)",
    border: "rgba(251,191,36,0.2)",
  };
  return {
    color: "var(--accent-red)",
    bg: "rgba(248,113,113,0.05)",
    border: "rgba(248,113,113,0.2)",
  };
}

function StatusIcon({ status }: { status: DetectedTool["status"] }) {
  switch (status) {
    case "accelerating":
      return <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-green)" }} />;
    case "stable":
      return <Minus className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />;
    case "stagnating":
      return <TrendingDown className="w-4 h-4" style={{ color: "var(--accent-red)" }} />;
  }
}

function statusLabel(status: DetectedTool["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: DetectedTool["status"]): string {
  switch (status) {
    case "accelerating":
      return "var(--accent-green)";
    case "stable":
      return "var(--text-secondary)";
    case "stagnating":
      return "var(--accent-red)";
  }
}

export function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to analyze repository");
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* URL Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Github className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/owner/repo"
            className="input-base w-full pl-11 pr-4 py-3 rounded-xl text-sm"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
            disabled={loading}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !repoUrl.trim()}
          className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 shrink-0"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          className="mt-6 p-4 rounded-xl text-sm"
          style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--accent-red)" }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          className="mt-8 p-6 rounded-xl flex items-center gap-3"
          style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
        >
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-cyan)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Fetching dependencies and analyzing against momentum data...
          </span>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-8 animate-fade-in">
          {/* Health Score */}
          {(() => {
            const s = scoreStyle(result.overallHealthScore);
            return (
              <div
                className="p-6 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="flex items-center gap-6">
                  <div
                    className="text-5xl font-bold"
                    style={{ color: s.color, fontFamily: "var(--font-jetbrains-mono), monospace" }}
                  >
                    {result.overallHealthScore}
                  </div>
                  <div>
                    <h2 className="text-base font-bold mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      Stack Health Score
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detected Tools */}
          <div>
            <h2 className="text-base font-bold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              Detected Tools
            </h2>
            <div className="grid gap-3">
              {result.detectedTools.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}>
                        {tool.name}
                      </span>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-lg"
                        style={{ background: "var(--border-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", fontFamily: "var(--font-syne), sans-serif" }}
                      >
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{tool.note}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <StatusIcon status={tool.status} />
                    <span className="text-sm font-medium" style={{ color: statusColor(tool.status), fontFamily: "var(--font-syne), sans-serif" }}>
                      {statusLabel(tool.status)}
                    </span>
                    {tool.momentumScore > 0 && (
                      <span className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        {tool.momentumScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Lightbulb className="w-4 h-4" style={{ color: "var(--accent-amber)" }} />
                <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  Upgrade Suggestions
                </h2>
              </div>
              <div className="grid gap-3">
                {result.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.03)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{suggestion.current}</span>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--accent-amber)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}>
                        {suggestion.suggested}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                      {suggestion.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Diagram */}
          {result.diagram && (
            <div>
              <h2 className="text-base font-bold mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Architecture Overview
              </h2>
              <MermaidDiagram chart={result.diagram} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
