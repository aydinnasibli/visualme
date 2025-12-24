"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { SankeyDiagramData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface SankeyDiagramProps {
  data: SankeyDiagramData;
  readOnly?: boolean;
}

const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

export default function SankeyDiagram({ data }: SankeyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !data.nodes.length) return;

    // Use ResizeObserver to ensure we get correct dimensions
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0] || !containerRef.current || !svgRef.current) return;

      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;

      // Clear previous
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Setup Sankey generator
      const sankeyGenerator = d3Sankey()
        .nodeWidth(20)
        .nodePadding(20)
        .extent([
          [1, 1],
          [width - 1, height - 20],
        ])
        .nodeId((d: any) => d.name); // Using name as ID for simple matching

      // Deep copy data because d3 mutates it
      const nodes = data.nodes.map(d => ({ ...d }));

      // Helper to resolve link references if they are strings
      const links = data.links.map(l => ({
         source: l.source,
         target: l.target,
         value: l.value
      }));

      try {
        // @ts-ignore - d3 types can be tricky with sankey custom data
        const { nodes: graphNodes, links: graphLinks } = sankeyGenerator({
          // @ts-ignore
          nodes,
          // @ts-ignore
          links,
        });

        const colorScale = d3.scaleOrdinal(COLORS);

        // Draw Links
        svg
          .append("g")
          .attr("fill", "none")
          .attr("stroke-opacity", 0.3)
          .selectAll("path")
          .data(graphLinks)
          .join("path")
          .attr("d", sankeyLinkHorizontal())
          .attr("stroke", (d: any) => {
               return `url(#gradient-${d.index})`;
          })
          .attr("stroke-width", (d: any) => Math.max(1, d.width))
          .style("transition", "all 0.3s")
          .on("mouseover", function() {
              d3.select(this).attr("stroke-opacity", 0.7);
          })
          .on("mouseout", function() {
              d3.select(this).attr("stroke-opacity", 0.3);
          })
          .append("title")
          .text((d: any) => `${d.source.name} → ${d.target.name}\n${d.value}`);

        // Define Gradients for links
        const defs = svg.append("defs");
        graphLinks.forEach((link: any, i: number) => {
          const gradientId = `gradient-${link.index}`;
          const gradient = defs
            .append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", link.source.x1)
            .attr("x2", link.target.x0);

          gradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(link.source.name));

          gradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(link.target.name));
        });

        // Draw Nodes
        const nodeGroup = svg
          .append("g")
          .selectAll("rect")
          .data(graphNodes)
          .join("g");

        nodeGroup
          .append("rect")
          .attr("x", (d: any) => d.x0)
          .attr("y", (d: any) => d.y0)
          .attr("height", (d: any) => Math.max(1, d.y1 - d.y0))
          .attr("width", (d: any) => d.x1 - d.x0)
          .attr("fill", (d: any) => colorScale(d.name))
          .attr("rx", 4)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0)
          .style("filter", (d: any) => `drop-shadow(0 0 8px ${colorScale(d.name)}60)`)
          .on("mouseover", (event, d) => setHoveredNode(d))
          .on("mouseout", () => setHoveredNode(null));

        // Labels
        nodeGroup
          .append("text")
          .attr("x", (d: any) => (d.x0 < width / 2 ? d.x1 + 10 : d.x0 - 10))
          .attr("y", (d: any) => (d.y1 + d.y0) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", (d: any) => (d.x0 < width / 2 ? "start" : "end"))
          .text((d: any) => d.name)
          .attr("fill", "#e4e4e7") // zinc-200
          .style("font-size", "12px")
          .style("font-weight", "500")
          .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

      } catch (e) {
        console.error("Sankey Layout Error:", e);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-8 relative">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />

        {/* Tooltip Overlay */}
        {hoveredNode && (
            <div
                className="absolute pointer-events-none bg-zinc-900/90 border border-zinc-700 p-2 rounded-lg text-xs z-50 backdrop-blur-md shadow-xl"
                style={{
                    left: hoveredNode.x1 + 10,
                    top: hoveredNode.y0
                }}
            >
                <div className="font-bold text-white mb-1">{hoveredNode.name}</div>
                <div className="text-zinc-400">Value: {hoveredNode.value}</div>
            </div>
        )}
      </div>
    </VisualizationContainer>
  );
}
