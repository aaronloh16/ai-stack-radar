"use client";

import { useState } from "react";
import {
  Loader2,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Package,
  GitFork,
  ListOrdered,
  Scale,
  MessageSquare,
  Bot,
  Server,
  Workflow,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import {
  useGenerateStream,
  type GenerateStatus,
} from "@/hooks/useGenerateStream";

const QUICK_PROMPTS = [
  {
    label: "RAG Chatbot",
    icon: MessageSquare,
    prompt:
      "A RAG chatbot for internal company docs with Slack integration and user auth",
  },
  {
    label: "AI Agent",
    icon: Bot,
    prompt:
      "An autonomous AI agent that can browse the web, call APIs, and complete multi-step tasks",
  },
  {
    label: "Full-stack SaaS",
    icon: Server,
    prompt:
      "A full-stack SaaS with AI-powered features, user auth, billing, and a dashboard",
  },
  {
    label: "ML Pipeline",
    icon: Workflow,
    prompt:
      "An ML pipeline that fine-tunes models, tracks experiments, and deploys to production",
  },
];

const GENERATION_STAGES: Array<{
  key: GenerateStatus;
  label: string;
  description: string;
}> = [
  { key: "selecting_tools", label: "Designing architecture", description: "Selecting optimal tools for your use case" },
  { key: "generating_diagram", label: "Generating diagram", description: "Building the architecture visualization" },
  { key: "validating_diagram", label: "Validating diagram", description: "Verifying diagram syntax and structure" },
];

function getStageState(
  stageKey: GenerateStatus,
  currentStatus: GenerateStatus
): "completed" | "active" | "pending" {
  const order: GenerateStatus[] = [
    "started",
    "selecting_tools",
    "tools_complete",
    "generating_diagram",
    "validating_diagram",
    "repairing_diagram",
    "complete",
  ];
  const currentIdx = order.indexOf(currentStatus);
  const stageIdx = order.indexOf(stageKey);

  if (currentIdx > stageIdx) return "completed";
  if (currentIdx === stageIdx) return "active";
  if (stageKey === "selecting_tools" && currentStatus === "tools_complete")
    return "completed";
  if (stageKey === "validating_diagram" && currentStatus === "repairing_diagram")
    return "active";
  return "pending";
}

function GenerationProgress({
  status,
  message,
}: {
  status: GenerateStatus;
  message: string;
}) {
  return (
    <div
      className="mt-8 p-6 rounded-xl"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
    >
      <div className="space-y-5">
        {GENERATION_STAGES.map((stage, i) => {
          const state = getStageState(stage.key, status);
          return (
            <div key={stage.key} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="relative flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: state === "completed"
                      ? "var(--accent-green-dim)"
                      : state === "active"
                        ? "var(--accent-cyan-dim)"
                        : "var(--border-subtle)",
                    border: `1px solid ${state === "completed"
                      ? "rgba(52,211,153,0.3)"
                      : state === "active"
                        ? "rgba(34,211,238,0.4)"
                        : "var(--border-default)"}`,
                  }}
                >
                  {state === "completed" ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
                  ) : state === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent-cyan)" }} />
                  ) : (
                    <Circle className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  )}
                </div>
                {i < GENERATION_STAGES.length - 1 && (
                  <div
                    className="w-px flex-1 mt-1"
                    style={{
                      height: "20px",
                      background: state === "completed" ? "rgba(52,211,153,0.3)" : "var(--border-subtle)",
                    }}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: state === "completed"
                      ? "var(--text-secondary)"
                      : state === "active"
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                    fontFamily: "var(--font-syne), sans-serif",
                  }}
                >
                  {stage.label}
                </p>
                {state === "active" && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {message && (
        <p
          className="text-xs mt-2 pt-4"
          style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function ArchitectureGenerator() {
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { state, generate } = useGenerateStream();

  const loading =
    state.status !== "idle" &&
    state.status !== "complete" &&
    state.status !== "error";
  const result = state.result;

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setShareUrl(null);
    generate(prompt);
  }

  async function handleCopyMarkdown() {
    if (!result) return;

    const markdown = `# Architecture: ${prompt}

## Summary
${result.summary}

## Recommended Stack
${result.tools.map((t) => `- **${t.name}** (${t.category}): ${t.reason}`).join("\n")}

## Architecture Diagram
\`\`\`mermaid
${result.diagram}
\`\`\`

## Build Steps
${result.buildSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Tradeoffs
${result.tradeoffs.map((t) => `- ${t}`).join("\n")}

---
Generated by [AI Stack Radar](https://ai-stack-radar.vercel.app) — architecture recommendations backed by live sentiment data.
`;

    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!result) return;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), result }),
      });
      const data = await res.json();
      if (data.url) {
        setShareUrl(window.location.origin + data.url);
        await navigator.clipboard.writeText(window.location.origin + data.url);
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  }

  return (
    <div>
      {/* Quick-start prompts */}
      {!result && !loading && (
        <div className="mb-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.12em" }}
          >
            Quick start
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => setPrompt(qp.prompt)}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-syne), sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                <qp.icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-cyan)" }} />
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build... (e.g., 'A RAG chatbot for internal company docs with Slack integration')"
          className="input-base w-full h-36 rounded-xl px-5 py-4 text-sm resize-none"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
          maxLength={2000}
          disabled={loading}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {prompt.length}/2000
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.01em" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Stack
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {state.status === "error" && (
        <div
          className="mt-6 p-4 rounded-xl text-sm"
          style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--accent-red)" }}
        >
          {state.error}
        </div>
      )}

      {/* Progressive generation status */}
      {loading && (
        <GenerationProgress status={state.status} message={state.message} />
      )}

      {/* Results */}
      {result && (
        <div className="mt-10 space-y-8 animate-fade-in">
          {/* Actions bar */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="btn-ghost px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {copied ? (
                <Check className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy as Markdown"}
            </button>
            <button
              onClick={handleShare}
              className="btn-ghost px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              <Share2 className="w-4 h-4" />
              {shareUrl ? "Link Copied!" : "Share"}
            </button>
          </div>

          {/* Summary */}
          <div
            className="p-5 rounded-xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {result.summary}
            </p>
          </div>

          {/* Recommended tools */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <Package className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--text-primary)" }}>
                Recommended Stack
              </h2>
            </div>
            <div className="grid gap-3">
              {result.tools.map((tool, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl transition-all"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}>
                      {tool.name}
                    </span>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-lg"
                      style={{
                        background: "var(--accent-cyan-dim)",
                        color: "var(--accent-cyan)",
                        border: "1px solid rgba(34,211,238,0.2)",
                        fontFamily: "var(--font-syne), sans-serif",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {tool.category}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {tool.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Diagram */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <GitFork className="w-4 h-4" style={{ color: "var(--accent-violet)" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--text-primary)" }}>
                Architecture Diagram
              </h2>
            </div>
            <MermaidDiagram chart={result.diagram} />
          </div>

          {/* Build Steps */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <ListOrdered className="w-4 h-4" style={{ color: "var(--accent-amber)" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--text-primary)" }}>
                Build Steps
              </h2>
            </div>
            <ol className="space-y-3">
              {result.buildSteps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--accent-cyan-dim)",
                      color: "var(--accent-cyan)",
                      border: "1px solid rgba(34,211,238,0.2)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm pt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tradeoffs */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <Scale className="w-4 h-4" style={{ color: "var(--accent-amber)" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--text-primary)" }}>
                Tradeoffs
              </h2>
            </div>
            <ul className="space-y-2.5">
              {result.tradeoffs.map((tradeoff, i) => (
                <li
                  key={i}
                  className="text-sm pl-4 leading-relaxed"
                  style={{
                    color: "var(--text-secondary)",
                    borderLeft: "2px solid var(--border-default)",
                  }}
                >
                  {tradeoff}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
