"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
} from "lucide-react";

interface ArchResult {
  summary: string;
  tools: Array<{
    name: string;
    category: string;
    reason: string;
  }>;
  diagram: string;
  buildSteps: string[];
  tradeoffs: string[];
}

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

function SkeletonLoader() {
  return (
    <div className="mt-8 space-y-8 animate-pulse">
      {/* Summary skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-zinc-800 rounded-lg w-3/4" />
        <div className="h-4 bg-zinc-800 rounded-lg w-1/2" />
      </div>

      {/* Tools skeleton */}
      <div>
        <div className="h-5 bg-zinc-800 rounded-lg w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-zinc-800 rounded-xl">
              <div className="h-4 bg-zinc-800 rounded w-48 mb-2" />
              <div className="h-3 bg-zinc-800/60 rounded w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Diagram skeleton */}
      <div>
        <div className="h-5 bg-zinc-800 rounded-lg w-48 mb-4" />
        <div className="h-64 border border-zinc-800 rounded-xl bg-zinc-900/30" />
      </div>

      {/* Build steps skeleton */}
      <div>
        <div className="h-5 bg-zinc-800 rounded-lg w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 shrink-0" />
              <div className="h-4 bg-zinc-800/60 rounded w-full mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArchitectureGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const renderMermaid = useCallback(
    async function renderMermaid() {
      if (!diagramRef.current || !result?.diagram) return;
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#3f3f46",
            primaryTextColor: "#fafafa",
            primaryBorderColor: "#52525b",
            lineColor: "#71717a",
            secondaryColor: "#27272a",
            tertiaryColor: "#18181b",
          },
        });
        const { svg } = await mermaid.render("mermaid-diagram", result.diagram);
        diagramRef.current.innerHTML = svg;
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<pre class="text-sm text-zinc-400 p-4 bg-zinc-900 rounded-lg overflow-x-auto">${result?.diagram}</pre>`;
        }
      }
    },
    [result]
  );

  useEffect(() => {
    if (result?.diagram && diagramRef.current) {
      renderMermaid();
    }
  }, [result?.diagram, renderMermaid]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShareUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate architecture");
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-zinc-500 mb-2.5 uppercase tracking-wider font-medium">
            Quick start
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => setPrompt(qp.prompt)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
              >
                <qp.icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build... (e.g., 'A RAG chatbot for internal company docs with Slack integration')"
          className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
          maxLength={2000}
          disabled={loading}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-zinc-600">{prompt.length}/2000</span>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {error && (
        <div className="mt-6 p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Skeleton loader */}
      {loading && <SkeletonLoader />}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-8">
          {/* Actions bar */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2 bg-zinc-800 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy as Markdown"}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-zinc-800 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {shareUrl ? "Link Copied!" : "Share"}
            </button>
          </div>

          {/* Summary */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <p className="text-zinc-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Recommended tools */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-semibold">Recommended Stack</h2>
            </div>
            <div className="grid gap-3">
              {result.tools.map((tool, i) => (
                <div
                  key={i}
                  className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-medium text-zinc-100">
                      {tool.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                      {tool.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {tool.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Diagram */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GitFork className="w-4 h-4 text-violet-400" />
              <h2 className="text-lg font-semibold">Architecture Diagram</h2>
            </div>
            <div
              ref={diagramRef}
              className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-x-auto flex justify-center"
            />
          </div>

          {/* Build Steps */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-semibold">Build Steps</h2>
            </div>
            <ol className="space-y-3">
              {result.buildSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="text-zinc-300 pt-0.5 leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tradeoffs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-orange-400" />
              <h2 className="text-lg font-semibold">Tradeoffs</h2>
            </div>
            <ul className="space-y-2">
              {result.tradeoffs.map((tradeoff, i) => (
                <li
                  key={i}
                  className="text-zinc-400 text-sm pl-4 border-l-2 border-zinc-700 leading-relaxed"
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
