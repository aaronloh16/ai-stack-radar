export interface MermaidValidationResult {
  valid: boolean;
  error?: string;
}

export function stripMermaidCodeFences(text: string): string {
  return text
    .replace(/^```mermaid\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

export async function validateMermaidSyntax(
  diagram: string
): Promise<MermaidValidationResult> {
  try {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false });
    await mermaid.parse(diagram);
    return { valid: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Mermaid syntax error";
    return { valid: false, error: message };
  }
}
