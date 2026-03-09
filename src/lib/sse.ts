export function sseMessage(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export interface SSEMessage {
  status: string;
  message?: string;
  result?: {
    summary: string;
    tools: Array<{ name: string; category: string; reason: string }>;
    diagramDescription: string;
    buildSteps: string[];
    tradeoffs: string[];
  };
  error?: string;
}

export function parseSSEBuffer(buffer: string): {
  messages: SSEMessage[];
  remainder: string;
} {
  const messages: SSEMessage[] = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;
    for (const line of part.split("\n")) {
      if (!line.startsWith("data:")) continue;
      try {
        messages.push(JSON.parse(line.slice(5).trim()) as SSEMessage);
      } catch {
        // skip malformed events
      }
    }
  }

  return { messages, remainder };
}
