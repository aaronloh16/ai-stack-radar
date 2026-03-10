import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { validateMermaidSyntax, stripMermaidCodeFences } from "@/lib/mermaid-validate";
import { getToolsWithLatestMetrics } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lazy-init: only creates client when ANTHROPIC_API_KEY is set
async function getAnthropicClient() {
  const { default: AnthropicSDK } = await import("@anthropic-ai/sdk");
  return new AnthropicSDK();
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ai-stack-radar",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

function extractNpmDeps(packageJsonStr: string): string[] {
  try {
    const pkg = JSON.parse(packageJsonStr);
    return [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

function extractPythonDeps(requirementsTxt: string): string[] {
  return requirementsTxt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
    .map((line) => line.split(/[=<>!~[\s]/)[0].toLowerCase());
}

function extractPyprojectDeps(pyprojectToml: string): string[] {
  const deps: string[] = [];
  const depSection = pyprojectToml.match(
    /\[(?:project\.)?dependencies\]\s*\n([\s\S]*?)(?:\n\[|\n$)/
  );
  if (depSection) {
    for (const line of depSection[1].split("\n")) {
      const trimmed = line.trim().replace(/^["']|["'].*$/g, "");
      if (trimmed && !trimmed.startsWith("#")) {
        deps.push(trimmed.split(/[=<>!~[\s]/)[0].toLowerCase());
      }
    }
  }
  // Also check for array-style dependencies
  const arrayMatch = pyprojectToml.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
  if (arrayMatch) {
    for (const match of arrayMatch[1].matchAll(/"([^"]+)"|'([^']+)'/g)) {
      const dep = (match[1] || match[2]).split(/[=<>!~[\s]/)[0].toLowerCase();
      if (dep) deps.push(dep);
    }
  }
  return [...new Set(deps)];
}

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "analyze_stack",
  description: "Analyze a repository's tech stack against momentum data",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "2-3 sentence overview of the project's tech stack and its health",
      },
      overallHealthScore: {
        type: "number",
        description:
          "Overall stack health score from 0-100 based on momentum of detected tools",
      },
      detectedTools: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            status: {
              type: "string",
              enum: ["accelerating", "stable", "stagnating"],
              description:
                "Tool momentum status based on velocity and community activity",
            },
            momentumScore: {
              type: "number",
              description: "Momentum score from our leaderboard, or 0 if not tracked",
            },
            note: {
              type: "string",
              description: "Brief note about this tool's trajectory",
            },
          },
          required: ["name", "category", "status", "momentumScore", "note"],
        },
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            current: {
              type: "string",
              description: "Current tool or gap in the stack",
            },
            suggested: {
              type: "string",
              description: "Suggested tool to adopt or switch to",
            },
            reason: {
              type: "string",
              description: "Why this change is recommended, referencing momentum data",
            },
          },
          required: ["current", "suggested", "reason"],
        },
        description: "Suggested upgrades or additions to the stack",
      },
      diagram: {
        type: "string",
        description:
          "Mermaid.js flowchart TD showing the current architecture with tools color-coded by momentum status",
      },
    },
    required: [
      "summary",
      "overallHealthScore",
      "detectedTools",
      "suggestions",
      "diagram",
    ],
  },
};

export async function POST(request: NextRequest) {
  // Anthropic API disabled — return friendly message
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Stack health analysis is temporarily disabled. Set ANTHROPIC_API_KEY to enable.",
      },
      { status: 503 }
    );
  }

  try {
    const { repoUrl } = await request.json();

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json({ error: "GitHub repo URL is required" }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Expected format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    // Fetch dependency files in parallel
    const [packageJson, requirementsTxt, pyprojectToml] = await Promise.all([
      fetchFileContent(parsed.owner, parsed.repo, "package.json"),
      fetchFileContent(parsed.owner, parsed.repo, "requirements.txt"),
      fetchFileContent(parsed.owner, parsed.repo, "pyproject.toml"),
    ]);

    if (!packageJson && !requirementsTxt && !pyprojectToml) {
      return NextResponse.json(
        {
          error:
            "Could not find dependency files (package.json, requirements.txt, or pyproject.toml). Is this a public repo?",
        },
        { status: 404 }
      );
    }

    // Extract dependencies
    const allDeps: string[] = [];
    if (packageJson) allDeps.push(...extractNpmDeps(packageJson));
    if (requirementsTxt) allDeps.push(...extractPythonDeps(requirementsTxt));
    if (pyprojectToml) allDeps.push(...extractPyprojectDeps(pyprojectToml));

    // Get all tools with their momentum data (3 queries instead of ~121)
    const toolsWithScores = await getToolsWithLatestMetrics();

    const leaderboardContext = toolsWithScores
      .sort((a, b) => b.overallScore - a.overallScore)
      .map(
        (t) =>
          `- ${t.name} (${t.category}): ${t.stars.toLocaleString()} stars, velocity=${t.starVelocity}/day, momentum=${t.overallScore.toFixed(1)} — ${t.description}`
      )
      .join("\n");

    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "analyze_stack" },
      messages: [
        {
          role: "user",
          content: `You are an AI stack health advisor. Analyze the following repository's dependencies against our live momentum leaderboard data.

Repository: ${parsed.owner}/${parsed.repo}

Detected dependencies:
${allDeps.join(", ")}

Momentum leaderboard (all tracked tools, sorted by score):
${leaderboardContext}

Instructions:
1. Identify which dependencies correspond to tools on our leaderboard (match by name, npm package name, or GitHub repo name)
2. For tracked tools, classify as "accelerating" (high velocity), "stable" (moderate), or "stagnating" (low/negative)
3. For important tools NOT on our leaderboard, still include them with a momentum score of 0 and a note
4. Suggest upgrades where a higher-momentum alternative exists in the same category
5. Calculate an overall health score (0-100) based on the weighted momentum of detected tools
6. Generate a Mermaid.js flowchart TD diagram showing the current architecture with tools color-coded:
   - Green (classDef accelerating) for accelerating tools
   - Yellow (classDef stable) for stable tools
   - Red (classDef stagnating) for stagnating tools

Mermaid syntax rules:
- Quote all node labels with special characters
- No classDef in subgraph declarations
- No spaces in pipe characters for edge labels
- No subgraph aliases
- No %%{init}%% directives`,
        },
      ],
    });

    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUseBlock) {
      return NextResponse.json(
        { error: "Failed to analyze repository" },
        { status: 500 }
      );
    }

    const result = toolUseBlock.input as Record<string, unknown>;

    // Validate and repair diagram
    let diagram = stripMermaidCodeFences(String(result.diagram ?? ""));
    const validation = await validateMermaidSyntax(diagram);
    if (!validation.valid) {
      const fixResponse = await (
        await getAnthropicClient()
      ).messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Fix this Mermaid.js diagram syntax error. Return ONLY the corrected Mermaid code — no explanation, no markdown fences.

Broken diagram:
${diagram}

Parser error:
${validation.error}

Rules: Quote node labels with special characters. No classDef in subgraph declarations. No spaces inside pipe characters. No subgraph aliases. No %%{init}%% directives.`,
          },
        ],
      });
      const fixedText = fixResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      diagram = stripMermaidCodeFences(fixedText);
    }
    result.diagram = diagram;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Analyze repo error:", error);
    return NextResponse.json({ error: "Failed to analyze repository" }, { status: 500 });
  }
}
