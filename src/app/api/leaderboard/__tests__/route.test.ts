import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { tools as toolsTable, momentumScores } from "@/lib/schema";

const mockToolRows = [
  { id: 1, name: "ToolA", repo: "org/tool-a", category: "llm", description: "LLM tool", website: "https://a.com", hnSearchTerms: [], npmPackage: null, pypiPackage: null, createdAt: new Date() },
  { id: 2, name: "ToolB", repo: "org/tool-b", category: "vector-db", description: "Vector DB", website: "https://b.com", hnSearchTerms: [], npmPackage: null, pypiPackage: null, createdAt: new Date() },
];

const mockScoreRows: Record<number, unknown> = {
  1: { starVelocity: 50, hnMentions7d: 3, hnPoints7d: 100, overallScore: 60, calculatedAt: new Date() },
  2: { starVelocity: 100, hnMentions7d: 5, hnPoints7d: 200, overallScore: 120, calculatedAt: new Date() },
};

const mockGHRows: Record<number, unknown> = {
  1: { stars: 10000, forks: 500 },
  2: { stars: 50000, forks: 2000 },
};

// Use vi.hoisted for the toolId tracker (available in vi.mock factory)
const { lastWhereToolId } = vi.hoisted(() => ({
  lastWhereToolId: { value: 0 },
}));

// Mock db using referential equality on the actual schema table objects
// to determine which table is being queried
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        // tools table: return all tools directly
        if (table === toolsTable) {
          return Promise.resolve(mockToolRows);
        }

        // momentum_scores or github_snapshots: return chainable
        const isScoreTable = table === momentumScores;
        return {
          where: () => {
            // Extract toolId from the eq() condition
            // The condition is a drizzle BinaryOperator but we can
            // inspect it via the mock's call — use a simpler approach:
            // the where() receives eq(column, value) which internally
            // stores the value. Since we can't easily extract it,
            // we track which tool is being queried by looking at the
            // condition's right-hand value.
            //
            // Simpler: drizzle eq() produces an object with .value
            // Let's just extract it from the SQL representation.
            // Actually simplest: since tools are queried in order via
            // Promise.all on allTools.map(), and within each map callback
            // the score query runs before the GH query (they await sequentially),
            // we can track by the score query setting the current toolId.
            if (isScoreTable) {
              // Score queries come first for each tool — cycle through tools
              const nextToolIdx = Object.values(mockScoreRows).length > 0
                ? (lastWhereToolId.value < mockToolRows.length ? lastWhereToolId.value : 0)
                : 0;
              lastWhereToolId.value = nextToolIdx + 1;
            }
            return {
              orderBy: () => ({
                limit: () => {
                  // Determine toolId based on table type
                  // Score query: use the incremented index
                  // GH query: use same toolId (runs right after score for same tool)
                  const toolId = isScoreTable
                    ? mockToolRows[lastWhereToolId.value - 1]?.id ?? 1
                    : mockToolRows[lastWhereToolId.value - 1]?.id ?? 1;

                  if (isScoreTable) {
                    return Promise.resolve(mockScoreRows[toolId] ? [mockScoreRows[toolId]] : []);
                  }
                  return Promise.resolve(mockGHRows[toolId] ? [mockGHRows[toolId]] : []);
                },
              }),
            };
          },
        };
      },
    }),
  },
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
    lastWhereToolId.value = 0;
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
});
