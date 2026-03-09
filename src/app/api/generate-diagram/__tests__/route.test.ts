import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

vi.mock("@/lib/mermaid-validate", () => ({
  validateMermaidSyntax: vi.fn().mockResolvedValue({ valid: true }),
  stripMermaidCodeFences: vi.fn((text: string) => text.trim()),
}));

import { POST } from "../route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/generate-diagram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate-diagram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns 500 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(
      makeRequest({
        diagramDescription: "Simple API flow",
        tools: ["Next.js"],
      })
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Diagram generation not configured");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3001/api/generate-diagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 400 for invalid input shape", async () => {
    const res = await POST(
      makeRequest({
        diagramDescription: "   ",
        tools: ["valid-tool", 123],
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid input");
  });

  it("returns diagram for valid input", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "graph TD\nA-->B",
    });

    const res = await POST(
      makeRequest({
        diagramDescription: " API gateway to worker ",
        tools: [" Next.js ", "Drizzle"],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.diagram).toBe("graph TD\nA-->B");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
