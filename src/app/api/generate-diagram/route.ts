import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  validateMermaidSyntax,
  stripMermaidCodeFences,
} from "@/lib/mermaid-validate";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Diagram generation not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const diagramDescription =
    typeof (body as { diagramDescription?: unknown })?.diagramDescription ===
    "string"
      ? (body as { diagramDescription: string }).diagramDescription.trim()
      : "";
  const tools =
    Array.isArray((body as { tools?: unknown })?.tools) &&
    (body as { tools: unknown[] }).tools.every(
      (item) => typeof item === "string" && item.trim().length > 0
    )
      ? (body as { tools: string[] }).tools.map((tool) => tool.trim())
      : [];

  if (
    !diagramDescription ||
    diagramDescription.length > 8000 ||
    tools.length === 0
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a Mermaid.js flowchart TD diagram based on this architecture description. Return ONLY valid Mermaid.js code — no explanation, no markdown fences, no commentary.

Architecture:
${diagramDescription}

Tools in the stack: ${tools.join(", ")}

${MERMAID_RULES}`,
    });

    let diagram = stripMermaidCodeFences(response.text ?? "");

    // Validate and repair if needed
    const MAX_FIX_ATTEMPTS = 3;
    let validation = await validateMermaidSyntax(diagram);

    for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS && !validation.valid; attempt++) {
      console.log(
        `Mermaid repair attempt ${attempt}/${MAX_FIX_ATTEMPTS}: ${validation.error}`
      );

      const fixResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Fix this Mermaid.js diagram syntax error. Return ONLY the corrected Mermaid code — no explanation, no markdown fences.

Broken diagram:
${diagram}

Parser error:
${validation.error}

${MERMAID_RULES}
Keep the diagram meaning and structure intact. Only fix the syntax.`,
      });

      diagram = stripMermaidCodeFences(fixResponse.text ?? "");
      validation = await validateMermaidSyntax(diagram);

      if (validation.valid) {
        console.log(`Mermaid repair succeeded on attempt ${attempt}`);
      } else if (attempt === MAX_FIX_ATTEMPTS) {
        console.warn("Mermaid repair failed after max attempts, using last attempt");
      }
    }

    return NextResponse.json({ diagram });
  } catch (error) {
    console.error("Diagram generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate diagram" },
      { status: 500 }
    );
  }
}
