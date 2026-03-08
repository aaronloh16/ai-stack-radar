import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock db
const mockInsert = vi.fn();
const mockSelect = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abc1234567"),
}));

import { POST, GET } from "../route";

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3001/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3001/api/share");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

describe("POST /api/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makePostRequest({ result: {} }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid data");
  });

  it("returns 400 when result is missing", async () => {
    const res = await POST(makePostRequest({ prompt: "test" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid data");
  });

  it("returns 400 when body is empty", async () => {
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it("saves and returns share URL on valid input", async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const res = await POST(
      makePostRequest({
        prompt: "Build a chatbot",
        result: { summary: "test", tools: [] },
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("abc1234567");
    expect(data.url).toBe("/stack/abc1234567");
  });

  it("returns 500 when DB insert fails", async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const res = await POST(
      makePostRequest({
        prompt: "test",
        result: { summary: "test" },
      })
    );

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to save stack");
  });
});

describe("GET /api/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id param is missing", async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("ID required");
  });

  it("returns 404 when stack is not found", async () => {
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    mockSelect.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest({ id: "nonexistent" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Stack not found");
  });

  it("returns stack data when found", async () => {
    const stackData = {
      id: "abc1234567",
      prompt: "Build a chatbot",
      result: { summary: "test" },
      createdAt: new Date().toISOString(),
    };
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([stackData]),
    };
    mockSelect.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest({ id: "abc1234567" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("abc1234567");
    expect(data.prompt).toBe("Build a chatbot");
  });

  it("returns 500 when DB query fails", async () => {
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error("DB error")),
    };
    mockSelect.mockReturnValue(mockChain);

    const res = await GET(makeGetRequest({ id: "abc1234567" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch stack");
  });
});
