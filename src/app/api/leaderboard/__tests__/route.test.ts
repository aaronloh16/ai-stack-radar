import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { ToolWithMetrics } from "@/lib/queries";

const mockTools: ToolWithMetrics[] = [
  {
    id: 1,
    name: "ToolA",
    repo: "org/tool-a",
    category: "llm",
    description: "LLM tool",
    website: "https://a.com",
    npmPackage: null,
    pypiPackage: null,
    stars: 10000,
    forks: 500,
    starVelocity: 50,
    hnMentions7d: 3,
    hnPoints7d: 100,
    npmDownloads7d: 0,
    pypiDownloads7d: 0,
    overallScore: 60,
    lastUpdated: new Date(),
  },
  {
    id: 2,
    name: "ToolB",
    repo: "org/tool-b",
    category: "vector-db",
    description: "Vector DB",
    website: "https://b.com",
    npmPackage: null,
    pypiPackage: null,
    stars: 50000,
    forks: 2000,
    starVelocity: 100,
    hnMentions7d: 5,
    hnPoints7d: 200,
    npmDownloads7d: 0,
    pypiDownloads7d: 0,
    overallScore: 120,
    lastUpdated: new Date(),
  },
];

const { mockGetTools } = vi.hoisted(() => ({
  mockGetTools: vi.fn(),
}));

vi.mock("@/lib/queries", () => ({
  getToolsWithLatestMetrics: mockGetTools,
}));

import { GET } from "../route";

function makeGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3001/api/leaderboard");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTools.mockResolvedValue(mockTools);
  });

  it("returns sorted leaderboard data", async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tools).toBeDefined();
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.length).toBe(2);
    // Should be sorted by overallScore descending (ToolB: 120 > ToolA: 60)
    expect(data.tools[0].name).toBe("ToolB");
    expect(data.tools[1].name).toBe("ToolA");
  });

  it("includes expected fields in response", async () => {
    const res = await GET(makeGetRequest());
    const data = await res.json();
    const tool = data.tools[0];
    expect(tool).toHaveProperty("id");
    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("repo");
    expect(tool).toHaveProperty("category");
    expect(tool).toHaveProperty("stars");
    expect(tool).toHaveProperty("forks");
    expect(tool).toHaveProperty("starVelocity");
    expect(tool).toHaveProperty("overallScore");
  });

  it("returns numeric values for scores and stars", async () => {
    const res = await GET(makeGetRequest());
    const data = await res.json();
    for (const tool of data.tools) {
      expect(typeof tool.stars).toBe("number");
      expect(typeof tool.overallScore).toBe("number");
      expect(typeof tool.starVelocity).toBe("number");
      expect(tool.overallScore).toBeGreaterThan(0);
    }
  });

  it("filters by category", async () => {
    const res = await GET(makeGetRequest({ category: "llm" }));
    const data = await res.json();
    expect(data.tools.length).toBe(1);
    expect(data.tools[0].name).toBe("ToolA");
  });

  it("returns 500 when query fails", async () => {
    mockGetTools.mockRejectedValue(new Error("DB connection failed"));
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch leaderboard");
  });
});
