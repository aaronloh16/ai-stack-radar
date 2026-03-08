import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { tools, momentumScores, githubSnapshots } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import {
  validateMermaidSyntax,
  stripMermaidCodeFences,
} from "@/lib/mermaid-validate";
import { sseMessage } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const anthropic = new Anthropic();

const MERMAID_RULES = `Follow these CRITICAL Mermaid.js syntax rules:
1. QUOTE all node labels containing special characters (parentheses, slashes, brackets, dots, ampersands).
   CORRECT: A["API Gateway (/api)"]
   WRONG: A[API Gateway (/api)]
2. DO NOT apply classDef styles in subgraph declarations.
   CORRECT: subgraph Frontend
   WRONG: subgraph Frontend:::style
3. NO spaces between pipe characters and edge labels.
   CORRECT: A -->|"sends request"| B
   WRONG: A -->| "sends request" | B
4. DO NOT give subgraphs an alias like nodes.
   CORRECT: subgraph "Backend Services"
   WRONG: subgraph backend["Backend Services"]
5. DO NOT include %%{init:...}%% directives — theme is handled externally.
6. Use classDef to color-code different component types (databases, services, APIs, etc.).
7. Keep the diagram primarily vertical (TD). Avoid long horizontal chains.`;

async function getLeaderboardContext(): Promise<string> {
  const allTools = await db.select().from(tools);

  const toolsWithScores = await Promise.all(
    allTools.map(async (tool) => {
      const [score] = await db
        .select()
        .from(momentumScores)
        .where(eq(momentumScores.toolId, tool.id))
        .orderBy(desc(momentumScores.calculatedAt))
        .limit(1);

      const [gh] = await db
        .select()
        .from(githubSnapshots)
        .where(eq(githubSnapshots.toolId, tool.id))
        .orderBy(desc(githubSnapshots.collectedAt))
        .limit(1);

      return {
        name: tool.name,
        category: tool.category,
        description: tool.description,
        stars: gh?.stars ?? 0,
        starVelocity: score?.starVelocity ?? 0,
        hnMentions7d: score?.hnMentions7d ?? 0,
        overallScore: score?.overallScore ?? 0,
      };
    })
  );

  toolsWithScores.sort((a, b) => b.overallScore - a.overallScore);

  return toolsWithScores
    .map(
      (t) =>
        `- ${t.name} (${t.category}): ${t.stars.toLocaleString()} stars, velocity=${t.starVelocity}/day, momentum=${t.overallScore.toFixed(1)} — ${t.description}`
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
              description:
                "Why this tool is recommended, referencing momentum data",
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
    required: [
      "summary",
      "tools",
      "diagramDescription",
      "buildSteps",
      "tradeoffs",
    ],
  },
};

interface Stage1Result {
  summary: string;
  tools: Array<{ name: string; category: string; reason: string }>;
  diagramDescription: string;
  buildSteps: string[];
  tradeoffs: string[];
}

async function repairDiagram(
  diagram: string,
  send: (payload: Record<string, unknown>) => void
): Promise<string> {
  const validation = await validateMermaidSyntax(diagram);
  if (validation.valid) return diagram;

  const MAX_FIX_ATTEMPTS = 3;
  let current = diagram;

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    send({
      status: "repairing_diagram",
      message: `Repairing diagram syntax (attempt ${attempt}/${MAX_FIX_ATTEMPTS})...`,
    });
    console.log(
      `Mermaid repair attempt ${attempt}/${MAX_FIX_ATTEMPTS}: ${validation.error}`
    );
    const fixResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Fix this Mermaid.js diagram syntax error. Return ONLY the corrected Mermaid code — no explanation, no markdown fences.

Broken diagram:
${current}

Parser error:
${validation.error}

${MERMAID_RULES}
Keep the diagram meaning and structure intact. Only fix the syntax.`,
        },
      ],
    });

    const fixedText = fixResponse.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    current = stripMermaidCodeFences(fixedText);

    const revalidation = await validateMermaidSyntax(current);
    if (revalidation.valid) {
      console.log(`Mermaid repair succeeded on attempt ${attempt}`);
      return current;
    }
    if (attempt === MAX_FIX_ATTEMPTS) {
      console.warn(
        "Mermaid repair failed after max attempts, using last attempt"
      );
    }
  }

  return current;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
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

        const stage1 = stage1Block.input as Stage1Result;

        send({
          status: "tools_complete",
          message: "Architecture designed. Generating diagram...",
        });

        // Stage 2: Generate Mermaid diagram from the architecture description
        send({
          status: "generating_diagram",
          message: "Generating Mermaid diagram...",
        });

        const stage2Response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `Generate a Mermaid.js flowchart TD diagram based on this architecture description. Return ONLY valid Mermaid.js code — no explanation, no markdown fences, no commentary.

Architecture:
${stage1.diagramDescription}

Tools in the stack: ${stage1.tools.map((t) => t.name).join(", ")}

${MERMAID_RULES}`,
            },
          ],
        });

        const diagramText = stage2Response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        let diagram = stripMermaidCodeFences(diagramText);

        // Validate and repair if needed
        send({
          status: "validating_diagram",
          message: "Validating diagram syntax...",
        });
        diagram = await repairDiagram(diagram, send);

        send({
          status: "complete",
          result: {
            summary: stage1.summary,
            tools: stage1.tools,
            diagram,
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
