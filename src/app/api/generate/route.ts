import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { tools, momentumScores, githubSnapshots } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const anthropic = new Anthropic();

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

const TOOL_DEFINITION: Anthropic.Tool = {
  name: "generate_architecture",
  description: "Generate a recommended tech stack and architecture for a project",
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
      diagram: {
        type: "string",
        description:
          "Mermaid.js flowchart TD diagram showing the architecture. MUST use valid syntax: quote node labels containing special characters, no classDef in subgraph declarations, no spaces inside pipe characters for edge labels, no subgraph aliases.",
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
    required: ["summary", "tools", "diagram", "buildSteps", "tradeoffs"],
  },
};

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const leaderboardContext = await getLeaderboardContext();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: [TOOL_DEFINITION],
      tool_choice: { type: "tool", name: "generate_architecture" },
      messages: [
        {
          role: "user",
          content: `You are an AI architecture advisor. You have access to live developer sentiment data that tracks which AI/dev tools are gaining momentum right now.

Here is the current momentum leaderboard (sorted by overall momentum score):
${leaderboardContext}

Based on this data, recommend a tech stack for the following project. Prefer tools with high momentum scores — they indicate strong community adoption and active development. But also consider maturity, fit for the use case, and practical considerations.

Generate a Mermaid.js architecture diagram using flowchart TD format. Follow these CRITICAL syntax rules:
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
7. Keep the diagram primarily vertical (TD). Avoid long horizontal chains of nodes.

Project description: ${prompt}`,
        },
      ],
    });

    // Extract the tool use result
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUseBlock) {
      return NextResponse.json(
        { error: "Failed to generate architecture" },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: toolUseBlock.input });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate architecture" },
      { status: 500 }
    );
  }
}
