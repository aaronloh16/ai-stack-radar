import { describe, expect, it } from "vitest";
import {
  isGeneratedArchitectureResult,
  isSharedArchitectureResult,
} from "@/lib/architecture";

const validTools = [
  { name: "Next.js", category: "framework", reason: "Great DX" },
];

describe("architecture validators", () => {
  it("accepts valid generated architecture result", () => {
    const value = {
      summary: "Build with a modern full-stack framework",
      tools: validTools,
      diagramDescription: "API calls service and persists to DB",
      buildSteps: ["Initialize app", "Add API routes"],
      tradeoffs: ["Higher complexity than monolith"],
    };

    expect(isGeneratedArchitectureResult(value)).toBe(true);
  });

  it("rejects invalid generated architecture result", () => {
    const value = {
      summary: "Missing array fields",
      tools: [],
      diagramDescription: "",
      buildSteps: [],
      tradeoffs: [],
    };

    expect(isGeneratedArchitectureResult(value)).toBe(false);
  });

  it("accepts valid shared architecture result", () => {
    const value = {
      summary: "Production architecture",
      tools: validTools,
      diagram: "graph TD; A-->B",
      buildSteps: ["Step 1"],
      tradeoffs: ["Tradeoff 1"],
    };

    expect(isSharedArchitectureResult(value)).toBe(true);
  });

  it("rejects invalid shared architecture result", () => {
    const value = {
      summary: "bad",
      tools: [{ name: "X", category: "Y", reason: "" }],
      diagram: "",
      buildSteps: ["ok"],
      tradeoffs: ["ok"],
    };

    expect(isSharedArchitectureResult(value)).toBe(false);
  });
});
