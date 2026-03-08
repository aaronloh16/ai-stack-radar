import { describe, it, expect } from "vitest";
import { stripMermaidCodeFences } from "@/lib/mermaid-validate";

describe("stripMermaidCodeFences", () => {
  it("strips opening and closing fences", () => {
    const input = "```mermaid\ngraph TD\n  A-->B\n```";
    expect(stripMermaidCodeFences(input)).toBe("graph TD\n  A-->B");
  });

  it("handles case-insensitive mermaid tag", () => {
    const input = "```Mermaid\ngraph TD\n```";
    expect(stripMermaidCodeFences(input)).toBe("graph TD");
  });

  it("returns trimmed input when no fences present", () => {
    const input = "  graph TD\n  A-->B  ";
    expect(stripMermaidCodeFences(input)).toBe("graph TD\n  A-->B");
  });

  it("handles empty string", () => {
    expect(stripMermaidCodeFences("")).toBe("");
  });

  it("handles fences with extra whitespace", () => {
    const input = "```mermaid  \ngraph TD\n```  ";
    expect(stripMermaidCodeFences(input)).toBe("graph TD");
  });

  it("only strips fences at start and end, not in the middle", () => {
    const input = "```mermaid\ngraph TD\nA[\"```test```\"]\n```";
    const result = stripMermaidCodeFences(input);
    expect(result).toContain('A["```test```"]');
  });
});
