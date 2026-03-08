import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock db before importing route
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock mermaid validation (uses dynamic import which is problematic in tests)
vi.mock("@/lib/mermaid-validate", () => ({
  validateMermaidSyntax: vi.fn().mockResolvedValue({ valid: true }),
  stripMermaidCodeFences: vi.fn((text: string) => text),
}));

// Mock Anthropic SDK — must be a class since route does `new Anthropic()`
// Use vi.hoisted so the variable is available inside the vi.mock factory
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { POST } from "../route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("returns 400 when prompt is not a string", async () => {
    const res = await POST(makeRequest({ prompt: 123 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("returns 400 when prompt exceeds 2000 characters", async () => {
    const res = await POST(makeRequest({ prompt: "a".repeat(2001) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("returns 400 for empty string prompt", async () => {
    const res = await POST(makeRequest({ prompt: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("accepts valid prompt and returns SSE stream", async () => {
    // Mock db to return empty tools list
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    } as never);

    // Mock Anthropic responses
    mockCreate
      // Stage 1: tool selection
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            name: "describe_architecture",
            input: {
              summary: "Test summary",
              tools: [{ name: "TestTool", category: "test", reason: "testing" }],
              diagramDescription: "A simple diagram",
              buildSteps: ["Step 1"],
              tradeoffs: ["Tradeoff 1"],
            },
          },
        ],
      })
      // Stage 2: diagram generation
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "graph TD\n  A-->B" }],
      });

    const res = await POST(makeRequest({ prompt: "Build a chatbot" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");

    const fullText = await readStream(res);
    expect(fullText).toContain("data:");
    expect(fullText).toContain('"status":"complete"');
    expect(fullText).toContain("Test summary");
  });

  it("streams error when Anthropic returns no tool_use block", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    } as never);

    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I cannot help with that" }],
    });

    const res = await POST(makeRequest({ prompt: "Build something" }));
    const fullText = await readStream(res);
    expect(fullText).toContain('"status":"error"');
  });

  it("streams error when DB query fails", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockRejectedValue(new Error("DB connection failed")),
    } as never);

    const res = await POST(makeRequest({ prompt: "Build a chatbot" }));
    const fullText = await readStream(res);
    expect(fullText).toContain('"status":"error"');
  });
});
