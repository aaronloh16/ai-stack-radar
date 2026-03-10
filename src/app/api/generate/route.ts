import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { sseMessage } from "@/lib/sse";
import {
  isGeneratedArchitectureResult,
  type GeneratedArchitectureResult,
} from "@/lib/architecture";
import { getToolsWithLatestMetrics } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lazy-init: only creates client when ANTHROPIC_API_KEY is set
async function getAnthropicClient() {
  const { default: AnthropicSDK } = await import("@anthropic-ai/sdk");
  return new AnthropicSDK();
}

async function getLeaderboardContext(): Promise<string> {
  const allTools = await getToolsWithLatestMetrics();

  return allTools
    .sort((a, b) => b.overallScore - a.overallScore)
    .map(
      (t) =>
        `- ${t.name} (${t.category}): ${t.stars.toLocaleString()} stars, velocity=${t.starVelocity}/day, downloads=${(t.npmDownloads7d + t.pypiDownloads7d).toLocaleString()}/wk, momentum=${t.overallScore.toFixed(1)} — ${t.description}`
    )
    .join("\n");
}

// Stage 1: Select tools and describe architecture (no diagram generation)
const STAGE1_TOOL: Anthropic.Tool = {
  name: "describe_architecture",
  description:
    "Describe the recommended architecture, select tools, and provide build guidance",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description:
          "A 1-2 sentence summary of what was requested and the recommended approach",
      },
      tools: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Tool name" },
            category: {
              type: "string",
              description: "Category (e.g., llm-framework, vector-db)",
            },
            reason: {
              type: "string",
              description: "Why this tool is recommended, referencing momentum data",
            },
          },
          required: ["name", "category", "reason"],
        },
        description: "Recommended tools for the stack",
      },
      diagramDescription: {
        type: "string",
        description:
          "Detailed description of what the architecture diagram should show: all components, subgraphs/layers, data flow directions, and relationships between services. Be specific about node names and connection labels.",
      },
      buildSteps: {
        type: "array",
        items: { type: "string" },
        description: "Ordered build steps to implement this architecture",
      },
      tradeoffs: {
        type: "array",
        items: { type: "string" },
        description: "Key tradeoffs and considerations for this architecture",
      },
    },
    required: ["summary", "tools", "diagramDescription", "buildSteps", "tradeoffs"],
  },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof (body as { prompt?: unknown })?.prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  if (!prompt || prompt.length > 2000) {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  // Anthropic API disabled — return friendly message (after input validation)
  if (!process.env.ANTHROPIC_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            sseMessage({
              status: "error",
              error:
                "Architecture generation is temporarily disabled. Set ANTHROPIC_API_KEY to enable.",
            })
          )
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseMessage(payload)));
      };

      try {
        send({ status: "started", message: "Fetching leaderboard context..." });
        const leaderboardContext = await getLeaderboardContext();

        // Stage 1: Select tools and describe the architecture
        send({
          status: "selecting_tools",
          message: "Selecting tools and designing architecture...",
        });

        const anthropic = await getAnthropicClient();
        const stage1Response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3072,
          tools: [STAGE1_TOOL],
          tool_choice: { type: "tool", name: "describe_architecture" },
          messages: [
            {
              role: "user",
              content: `You are an AI architecture advisor. You have access to live developer sentiment data that tracks which AI/dev tools are gaining momentum right now.

Here is the current momentum leaderboard (sorted by overall momentum score):
${leaderboardContext}

Based on this data, recommend a tech stack for the following project. Prefer tools with high momentum scores — they indicate strong community adoption and active development. But also consider maturity, fit for the use case, and practical considerations.

In your diagramDescription, be very detailed about the architecture: list every component, which subgraphs/layers they belong to, how data flows between them, and what each connection represents. This description will be used to generate a Mermaid diagram in a separate step.

Project description: ${prompt}`,
            },
          ],
        });

        const stage1Block = stage1Response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
        );

        if (!stage1Block) {
          send({ status: "error", error: "Failed to generate architecture" });
          controller.close();
          return;
        }

        if (!isGeneratedArchitectureResult(stage1Block.input)) {
          send({
            status: "error",
            error: "Model returned an invalid architecture format",
          });
          controller.close();
          return;
        }

        const stage1: GeneratedArchitectureResult = stage1Block.input;

        send({
          status: "tools_complete",
          message: "Architecture designed.",
        });

        send({
          status: "complete",
          result: {
            summary: stage1.summary,
            tools: stage1.tools,
            diagramDescription: stage1.diagramDescription,
            buildSteps: stage1.buildSteps,
            tradeoffs: stage1.tradeoffs,
          },
        });
      } catch (error) {
        console.error("Generate API error:", error);
        send({ status: "error", error: "Failed to generate architecture" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
