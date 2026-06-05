"use client";

import { useRef, useEffect, useState } from "react";
import { select } from "d3-selection";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyDiagramData } from "@/lib/types/visualization";

interface SankeyProps {
  data: SankeyDiagramData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#6366f1","#14b8a6","#f97316"];

interface SNode { name: string; index?: number; x0?: number; x1?: number; y0?: number; y1?: number; }
interface SLink { source: number | SNode; target: number | SNode; value: number; width?: number; y0?: number; y1?: number; }

export default function SankeyDiagram({ data }: SankeyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data?.nodes?.length) return;
    const { w, h } = dims;
    const pad = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const idToIdx = new Map(data.nodes.map((n, i) => [n.id, i]));
    const graphNodes: SNode[] = data.nodes.map((n) => ({ name: n.name }));
    const graphLinks: SLink[] = data.links
      .map((l) => ({
        source: typeof l.source === "string" ? (idToIdx.get(l.source) ?? 0) : (l.source as number),
        target: typeof l.target === "string" ? (idToIdx.get(l.target) ?? 0) : (l.target as number),
        value: Math.max(1, l.value),
      }))
      .filter((l) => l.source !== l.target);

    const sankeyLayout = sankey<SNode, SLink>()
      .nodeWidth(18)
      .nodePadding(12)
      .extent([[0, 0], [innerW, innerH]]);

    let layoutGraph;
    try {
      layoutGraph = sankeyLayout({ nodes: graphNodes, links: graphLinks });
    } catch {
      return;
    }

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${pad.left},${pad.top})`);

    // Links
    const linkPaths = g.append("g").selectAll<SVGPathElement, SLink>("path");
    linkPaths
      .data(layoutGraph.links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", (d: SLink) => Math.max(1, d.width ?? 1))
      .on("mouseenter", function (this: SVGPathElement) {
        select(this).attr("stroke-opacity", 0.65);
      })
      .on("mouseleave", function (this: SVGPathElement) {
        select(this).attr("stroke-opacity", 0.35);
      });

    // Node rects
    const nodeG = g.append("g").selectAll<SVGGElement, SNode>("g")
      .data(layoutGraph.nodes)
      .enter()
      .append("g");

    nodeG.append("rect")
      .attr("x", (d: SNode) => d.x0 ?? 0)
      .attr("y", (d: SNode) => d.y0 ?? 0)
      .attr("width", (d: SNode) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr("height", (d: SNode) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr("fill", (_: SNode, i: number) => COLORS[i % COLORS.length])
      .attr("fill-opacity", 0.85)
      .attr("rx", 3);

    nodeG.append("text")
      .attr("x", (d: SNode) => ((d.x0 ?? 0) < innerW / 2 ? (d.x1 ?? 0) + 8 : (d.x0 ?? 0) - 8))
      .attr("y", (d: SNode) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: SNode) => ((d.x0 ?? 0) < innerW / 2 ? "start" : "end"))
      .attr("fill", "#e4e4e7")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("font-family", "Inter, ui-sans-serif")
      .text((d: SNode) => d.name);
  }, [data, dims]);

  if (!data?.nodes?.length) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-zinc-500 text-sm">No data to display</p>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} width={dims.w} height={dims.h} />
    </div>
  );
}
