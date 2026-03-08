import { ArchitectureGenerator } from "@/components/architecture-generator";
import { Sparkles } from "lucide-react";

export default function GeneratePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent-violet-dim)", border: "1px solid rgba(167,139,250,0.2)" }}
          >
            <Sparkles className="w-4.5 h-4.5" style={{ color: "var(--accent-violet)" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne), sans-serif", letterSpacing: "-0.03em" }}
          >
            Architecture Generator
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Describe what you want to build. Get a recommended stack backed by live
          developer sentiment data.
        </p>
      </div>

      <div className="animate-fade-in-up delay-100">
        <ArchitectureGenerator />
      </div>
    </div>
  );
}
