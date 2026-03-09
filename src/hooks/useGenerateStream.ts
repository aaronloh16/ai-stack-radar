"use client";

import { useState, useCallback } from "react";
import { parseSSEBuffer, type SSEMessage } from "@/lib/sse";

export type GenerateStatus =
  | "idle"
  | "started"
  | "selecting_tools"
  | "tools_complete"
  | "complete"
  | "error";

export interface ArchResult {
  summary: string;
  tools: Array<{ name: string; category: string; reason: string }>;
  diagramDescription: string;
  buildSteps: string[];
  tradeoffs: string[];
}

interface GenerateStreamState {
  status: GenerateStatus;
  message: string;
  result: ArchResult | null;
  error: string | null;
}

const STATUS_MESSAGES: Record<string, string> = {
  started: "Fetching leaderboard context...",
  selecting_tools: "Selecting tools and designing architecture...",
  tools_complete: "Architecture designed.",
  complete: "Done!",
};

export function useGenerateStream() {
  const [state, setState] = useState<GenerateStreamState>({
    status: "idle",
    message: "",
    result: null,
    error: null,
  });

  const generate = useCallback(async (prompt: string) => {
    setState({
      status: "started",
      message: "Starting...",
      result: null,
      error: null,
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to generate architecture");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { messages, remainder } = parseSSEBuffer(buffer);
        buffer = remainder;

        for (const msg of messages) {
          handleMessage(msg, setState);
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    }
  }, []);

  return { state, generate };
}

function handleMessage(
  msg: SSEMessage,
  setState: React.Dispatch<React.SetStateAction<GenerateStreamState>>
) {
  if (msg.status === "error") {
    setState((prev) => ({
      ...prev,
      status: "error",
      error: msg.error ?? "Generation failed",
    }));
    return;
  }

  if (msg.status === "complete" && msg.result) {
    setState({
      status: "complete",
      message: "Done!",
      result: msg.result,
      error: null,
    });
    return;
  }

  setState((prev) => ({
    ...prev,
    status: msg.status as GenerateStatus,
    message:
      msg.message ?? STATUS_MESSAGES[msg.status] ?? prev.message,
  }));
}
