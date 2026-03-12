import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock getToolsWithLatestMetrics (replaces old db mock)
const { mockGetTools } = vi.hoisted(() => ({
  mockGetTools: vi.fn(),
}));

vi.mock("@/lib/queries", () => ({
  getToolsWithLatestMetrics: mockGetTools,
}));

// Mock mermaid validation (uses dynamic import which is problematic in tests)
vi.mock("@/lib/mermaid-validate", () => ({
  validateMermaidSyntax: vi.fn().mockResolvedValue({ valid: true }),
  stripMermaidCodeFences: vi.fn((text: string) => text),
}));

// Mock Anthropic SDK — must be a class since route does `new Anthropic()`
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
import { _resetRateLimitStore } from "@/lib/rate-limit";

function makeRequest(body: unknown, ip: string = "127.0.0.1"): NextRequest {
  return new NextRequest("http://localhost:3001/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
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
    mockGetTools.mockResolvedValue([]);
    // Set API key so tests reach the Anthropic code path
    process.env.ANTHROPIC_API_KEY = "test-key";
    // Reset rate limiter between tests
    _resetRateLimitStore();
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

  it("returns 400 for whitespace-only prompt", async () => {
    const res = await POST(makeRequest({ prompt: "   " }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3001/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("accepts valid prompt and returns SSE stream", async () => {
    // Mock Anthropic response
    mockCreate.mockResolvedValueOnce({
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
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I cannot help with that" }],
    });

    const res = await POST(makeRequest({ prompt: "Build something" }));
    const fullText = await readStream(res);
    expect(fullText).toContain('"status":"error"');
  });

  it("streams error when query fails", async () => {
    mockGetTools.mockRejectedValue(new Error("DB connection failed"));

    const res = await POST(makeRequest({ prompt: "Build a chatbot" }));
    const fullText = await readStream(res);
    expect(fullText).toContain('"status":"error"');
  });

  it("returns 503 when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(makeRequest({ prompt: "Build a chatbot" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("not configured");
  });

  describe("rate limiting", () => {
    it("returns 429 after 10 requests from the same IP", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "describe_architecture",
            input: {
              summary: "Test",
              tools: [{ name: "T", category: "c", reason: "r" }],
              diagramDescription: "d",
              buildSteps: ["s"],
              tradeoffs: ["t"],
            },
          },
        ],
      });

      // Send 10 requests — all should succeed
      for (let i = 0; i < 10; i++) {
        const res = await POST(makeRequest({ prompt: "Build a chatbot" }, "10.0.0.1"));
        expect(res.status).toBe(200);
        // Consume stream to avoid hanging
        await readStream(res);
      }

      // 11th request should be rate-limited
      const res = await POST(makeRequest({ prompt: "Build a chatbot" }, "10.0.0.1"));
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain("Too many requests");
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });

    it("allows requests from different IPs independently", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "describe_architecture",
            input: {
              summary: "Test",
              tools: [{ name: "T", category: "c", reason: "r" }],
              diagramDescription: "d",
              buildSteps: ["s"],
              tradeoffs: ["t"],
            },
          },
        ],
      });

      // Max out IP A
      for (let i = 0; i < 10; i++) {
        const res = await POST(makeRequest({ prompt: "Build a chatbot" }, "10.0.0.1"));
        await readStream(res);
      }

      // IP B should still work
      const res = await POST(makeRequest({ prompt: "Build a chatbot" }, "10.0.0.2"));
      expect(res.status).toBe(200);
      await readStream(res);
    });
  });
});
