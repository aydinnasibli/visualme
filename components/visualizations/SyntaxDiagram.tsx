"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import type { SyntaxDiagramData } from "@/lib/types/visualization";

interface SyntaxDiagramProps {
  data: SyntaxDiagramData;
  readOnly?: boolean;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0f1419",
    primaryColor: "#8b5cf620",
    primaryBorderColor: "#8b5cf6",
    primaryTextColor: "#e4e4e7",
    lineColor: "#6366f1",
    secondaryColor: "#06b6d420",
    tertiaryColor: "#10b98120",
    edgeLabelBackground: "#1c1c24",
    clusterBkg: "#19212e",
    titleColor: "#a1a1aa",
    fontFamily: "Inter, ui-sans-serif",
  },
  flowchart: { curve: "basis", htmlLabels: true },
});

function buildMermaidSyntax(data: SyntaxDiagramData): string {
  // If rules are present, render as a flowchart showing grammar rules
  if (data.rules?.length) {
    const lines = ["flowchart LR"];
    const truncate = (s: string, max = 48) => s.length > max ? s.slice(0, max) + "…" : s;
    data.rules.forEach((rule, i) => {
      const nodeId = `R${i}`;
      const patternId = `P${i}`;
      lines.push(`    ${nodeId}["${truncate(rule.name)}"]`);
      lines.push(`    ${patternId}(["${truncate(rule.pattern.replace(/"/g, "'"))}"])`);
      lines.push(`    ${nodeId} --> ${patternId}`);
    });
    return lines.join("\n");
  }

  // Fallback: parse inline mermaid if syntax field looks like mermaid
  if (data.syntax?.trim()) {
    const s = data.syntax.trim();
    if (s.startsWith("graph") || s.startsWith("flowchart") || s.startsWith("sequenceDiagram") || s.startsWith("classDiagram")) {
      return s;
    }
    // Wrap raw text as a simple flowchart node
    return `flowchart TD\n    A["${s.slice(0, 80)}"]`;
  }

  return `flowchart TD\n    A["No syntax data"]`;
}

export default function SyntaxDiagram({ data }: SyntaxDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const diagram = buildMermaidSyntax(data);
    // Increment counter to get a fresh ID on each render — mermaid caches by ID
    renderCountRef.current += 1;
    const id = `mermaid-${renderCountRef.current}`;

    mermaid
      .render(id, diagram)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG fill container
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.width = "100%";
            svgEl.style.height = "100%";
            svgEl.style.maxWidth = "none";
          }
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div style="color:#71717a;padding:16px;font-size:12px">Could not render diagram</div>`;
        }
      });
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
    </div>
  );
}
