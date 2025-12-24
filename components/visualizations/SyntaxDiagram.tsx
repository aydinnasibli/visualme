"use client";

import React, { useEffect, useRef } from "react";
// @ts-ignore
import rr from "railroad-diagrams";
import { SyntaxDiagramData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";
import "railroad-diagrams/railroad-diagrams.css";

interface SyntaxDiagramProps {
  data: SyntaxDiagramData;
  readOnly?: boolean;
}

export default function SyntaxDiagram({ data }: SyntaxDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous
    containerRef.current.innerHTML = "";

    try {
      // Very basic parser to convert "rules" to railroad calls.
      // In a real app, this would interpret a BNF or specific JSON structure recursively.
      // For now, we will just chain the rules provided in sequence as a demonstration.

      // Map data.rules to railroad components
      const components = data.rules.map(rule => {
        // Simple heuristic: if pattern is "literal", use Terminal, else NonTerminal
        // Real implementation requires structured input, not just strings.
        // Assuming data.rules is [{ name: 'SELECT', pattern: 'literal' }, ...] for now.

        // As a fallback for this demo, we treat uppercase as Terminal, lowercase as NonTerminal
        if (rule.name === rule.name.toUpperCase()) {
            return rr.Terminal(rule.name);
        } else {
            return rr.NonTerminal(rule.name);
        }
      });

      const diagram = rr.Diagram(...components);
      diagram.addTo(containerRef.current);
    } catch (e) {
      console.error("Railroad diagram error:", e);
      if (containerRef.current) {
        containerRef.current.innerText = "Error generating syntax diagram.";
      }
    }
  }, [data]);

  return (
    <VisualizationContainer>
      <div className="w-full h-full flex items-center justify-center p-8 bg-[#0f1419]">
        <style>{`
          svg.railroad-diagram {
            background-color: transparent;
          }
          svg.railroad-diagram path {
            stroke-width: 2;
            stroke: #71717a; /* zinc-500 */
          }
          svg.railroad-diagram text {
            fill: #e4e4e7; /* zinc-200 */
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
          }
          svg.railroad-diagram text.label {
            fill: #a1a1aa; /* zinc-400 */
          }
          svg.railroad-diagram rect {
            fill: #27272a; /* zinc-800 */
            stroke: #52525b; /* zinc-600 */
          }
          svg.railroad-diagram rect:hover {
            fill: #3f3f46;
            stroke: #8b5cf6; /* purple-500 */
          }
        `}</style>
        <div ref={containerRef} className="overflow-auto max-w-full max-h-full" />
      </div>
    </VisualizationContainer>
  );
}
