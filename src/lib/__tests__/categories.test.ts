import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import toolsData from "@/data/tools.json";

describe("categories", () => {
  it("every tool in tools.json has a matching category", () => {
    const missing = toolsData.filter((tool) => !CATEGORIES[tool.category]);
    expect(missing).toEqual([]);
  });

  it("CATEGORY_ORDER contains all category keys", () => {
    expect(CATEGORY_ORDER).toEqual(Object.keys(CATEGORIES));
  });

  it("all category labels are non-empty strings", () => {
    for (const label of Object.values(CATEGORIES)) {
      expect(label.length).toBeGreaterThan(0);
      expect(typeof label).toBe("string");
    }
  });
});

describe("tools.json", () => {
  it("every tool has required fields", () => {
    for (const tool of toolsData) {
      expect(tool.name).toBeTruthy();
      expect(tool.repo).toMatch(/^[^/]+\/[^/]+$/); // org/repo format
      expect(tool.category).toBeTruthy();
      expect(Array.isArray(tool.hn_search_terms)).toBe(true);
      expect(tool.hn_search_terms.length).toBeGreaterThan(0);
    }
  });

  it("no duplicate repo entries", () => {
    const repos = toolsData.map((t) => t.repo);
    const unique = new Set(repos);
    expect(repos.length).toBe(unique.size);
  });

  it("no duplicate tool names", () => {
    const names = toolsData.map((t) => t.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });
});
