"use client";

import { useEffect, useRef, useCallback } from "react";
import type SvgPanZoom from "svg-pan-zoom";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  const panZoomRef = useRef<SvgPanZoom.Instance | null>(null);

  const render = useCallback(async () => {
    if (!containerRef.current || !chart) return;

    // Destroy existing pan-zoom instance before re-rendering
    if (panZoomRef.current) {
      panZoomRef.current.destroy();
      panZoomRef.current = null;
    }

    try {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#3f3f46",
          primaryTextColor: "#fafafa",
          primaryBorderColor: "#52525b",
          lineColor: "#71717a",
          secondaryColor: "#27272a",
          tertiaryColor: "#18181b",
        },
      });
      const { svg } = await mermaid.render(idRef.current, chart);
      containerRef.current.innerHTML = svg;

      // Attach pan-zoom after the SVG is in the DOM
      requestAnimationFrame(async () => {
        const svgElement = containerRef.current?.querySelector("svg");
        if (!svgElement) return;

        svgElement.style.maxWidth = "none";
        svgElement.style.width = "100%";
        svgElement.style.height = "100%";

        try {
          const svgPanZoom = (await import("svg-pan-zoom")).default;
          panZoomRef.current = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true,
            minZoom: 0.1,
            maxZoom: 10,
            zoomScaleSensitivity: 0.3,
          });
        } catch (err) {
          console.error("svg-pan-zoom init error:", err);
        }
      });
    } catch (err) {
      console.error("Mermaid render error:", err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<pre class="text-sm text-zinc-400 p-4 bg-zinc-900 rounded-lg overflow-x-auto">${escapeHtml(chart)}</pre>`;
      }
    }
  }, [chart]);

  useEffect(() => {
    render();
    return () => {
      if (panZoomRef.current) {
        panZoomRef.current.destroy();
        panZoomRef.current = null;
      }
    };
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="h-[500px] p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden flex justify-center"
    />
  );
}
