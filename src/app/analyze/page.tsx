import { RepoAnalyzer } from "@/components/repo-analyzer";
import { Activity } from "lucide-react";

export default function AnalyzePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent-green-dim)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <Activity className="w-4.5 h-4.5" style={{ color: "var(--accent-green)" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne), sans-serif", letterSpacing: "-0.03em" }}
          >
            Stack Health Check
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Paste a GitHub repo URL to analyze its dependencies against the
          momentum leaderboard. See what&apos;s accelerating, what&apos;s
          stagnating, and where to upgrade.
        </p>
      </div>

      <div className="animate-fade-in-up delay-100">
        <RepoAnalyzer />
      </div>
    </div>
  );
}
