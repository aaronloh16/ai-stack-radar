export interface ToolRecommendation {
  name: string;
  category: string;
  reason: string;
}

export interface GeneratedArchitectureResult {
  summary: string;
  tools: ToolRecommendation[];
  diagramDescription: string;
  buildSteps: string[];
  tradeoffs: string[];
}

export interface SharedArchitectureResult {
  summary: string;
  tools: ToolRecommendation[];
  diagram: string;
  buildSteps: string[];
  tradeoffs: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isToolRecommendation(value: unknown): value is ToolRecommendation {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.category) &&
    isNonEmptyString(value.reason)
  );
}

export function isGeneratedArchitectureResult(
  value: unknown
): value is GeneratedArchitectureResult {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.summary) &&
    Array.isArray(value.tools) &&
    value.tools.length > 0 &&
    value.tools.every(isToolRecommendation) &&
    isNonEmptyString(value.diagramDescription) &&
    isStringArray(value.buildSteps) &&
    value.buildSteps.length > 0 &&
    isStringArray(value.tradeoffs) &&
    value.tradeoffs.length > 0
  );
}

export function isSharedArchitectureResult(
  value: unknown
): value is SharedArchitectureResult {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.summary) &&
    Array.isArray(value.tools) &&
    value.tools.length > 0 &&
    value.tools.every(isToolRecommendation) &&
    isNonEmptyString(value.diagram) &&
    isStringArray(value.buildSteps) &&
    value.buildSteps.length > 0 &&
    isStringArray(value.tradeoffs) &&
    value.tradeoffs.length > 0
  );
}
