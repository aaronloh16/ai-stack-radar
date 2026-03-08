import { describe, it, expect } from "vitest";
import { sseMessage, parseSSEBuffer } from "@/lib/sse";

describe("sseMessage", () => {
  it("formats a payload as an SSE data line", () => {
    const result = sseMessage({ status: "started" });
    expect(result).toBe('data: {"status":"started"}\n\n');
  });

  it("serializes nested objects", () => {
    const result = sseMessage({
      status: "complete",
      result: { summary: "test", tools: [] },
    });
    const parsed = JSON.parse(result.replace("data: ", "").trim());
    expect(parsed.status).toBe("complete");
    expect(parsed.result.summary).toBe("test");
  });
});

describe("parseSSEBuffer", () => {
  it("parses a single complete message", () => {
    const buffer = 'data: {"status":"started"}\n\n';
    const { messages, remainder } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe("started");
    expect(remainder).toBe("");
  });

  it("parses multiple complete messages", () => {
    const buffer =
      'data: {"status":"started"}\n\n' +
      'data: {"status":"selecting_tools"}\n\n';
    const { messages, remainder } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(2);
    expect(messages[0].status).toBe("started");
    expect(messages[1].status).toBe("selecting_tools");
    expect(remainder).toBe("");
  });

  it("keeps incomplete messages as remainder", () => {
    const buffer = 'data: {"status":"started"}\n\ndata: {"status":';
    const { messages, remainder } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe("started");
    expect(remainder).toBe('data: {"status":');
  });

  it("returns empty messages for empty buffer", () => {
    const { messages, remainder } = parseSSEBuffer("");
    expect(messages).toHaveLength(0);
    expect(remainder).toBe("");
  });

  it("skips malformed JSON gracefully", () => {
    const buffer = "data: {broken json}\n\ndata: {\"status\":\"ok\"}\n\n";
    const { messages } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe("ok");
  });

  it("ignores lines that don't start with data:", () => {
    const buffer = "event: ping\ndata: {\"status\":\"ok\"}\n\n";
    const { messages } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe("ok");
  });

  it("parses a complete result message", () => {
    const result = {
      summary: "Test summary",
      tools: [{ name: "Tool1", category: "llm", reason: "Good" }],
      diagram: "graph TD; A-->B",
      buildSteps: ["Step 1"],
      tradeoffs: ["Tradeoff 1"],
    };
    const buffer = `data: ${JSON.stringify({ status: "complete", result })}\n\n`;
    const { messages } = parseSSEBuffer(buffer);
    expect(messages).toHaveLength(1);
    expect(messages[0].result?.summary).toBe("Test summary");
    expect(messages[0].result?.tools).toHaveLength(1);
  });
});
