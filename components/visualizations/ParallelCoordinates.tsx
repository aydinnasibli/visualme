"use client";

import { useRef, useEffect, useState } from "react";
import { select } from "d3-selection";
import { scalePoint, scaleLinear } from "d3-scale";
import { axisLeft } from "d3-axis";
import { min, max } from "d3-array";
import { line } from "d3-shape";
import type { ParallelCoordinatesData } from "@/lib/types/visualization";

interface ParallelCoordinatesProps {
  data: ParallelCoordinatesData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316"];

export default function ParallelCoordinates({ data }: ParallelCoordinatesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 400 });

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
    if (!svgRef.current || !data?.data?.length || !data?.dimensions?.length) return;
    const { w, h } = dims;
    const pad = { top: 40, right: 40, bottom: 20, left: 40 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;
    const dimNames = data.dimensions;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${pad.left},${pad.top})`);

    const xScale = scalePoint<string>().domain(dimNames).range([0, innerW]).padding(0.1);

    const yScales: Record<string, ReturnType<typeof scaleLinear<number>>> = {};
    dimNames.forEach((dim) => {
      const vals = data.data.map((d) => d[dim] ?? 0);
      yScales[dim] = scaleLinear<number>()
        .domain([min(vals) ?? 0, max(vals) ?? 1])
        .range([innerH, 0])
        .nice();
    });

    const linePath = (d: Record<string, number>) =>
      line<string>()
        .x((dim) => xScale(dim) ?? 0)
        .y((dim) => yScales[dim](d[dim] ?? 0))
        (dimNames);

    // Lines
    const paths = g.append("g").selectAll<SVGPathElement, Record<string, number>>("path");
    paths
      .data(data.data)
      .enter()
      .append("path")
      .attr("d", (d) => linePath(d) ?? "")
      .attr("fill", "none")
      .attr("stroke", (_: Record<string, number>, i: number) => COLORS[i % COLORS.length])
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5)
      .on("mouseenter", function (this: SVGPathElement) {
        select(this).attr("stroke-opacity", 1).attr("stroke-width", 2.5);
        // raise() equivalent - move to end of parent
        const node = this.parentNode;
        if (node) node.appendChild(this);
      })
      .on("mouseleave", function (this: SVGPathElement) {
        select(this).attr("stroke-opacity", 0.5).attr("stroke-width", 1.5);
      });

    // Axes
    dimNames.forEach((dim) => {
      const ax = g.append("g").attr("transform", `translate(${xScale(dim)},0)`);
      ax.call(axisLeft(yScales[dim]).ticks(5).tickSize(4))
        .call((a) => a.select(".domain").attr("stroke", "#3f3f46"))
        .call((a) => a.selectAll(".tick line").attr("stroke", "#3f3f46"))
        .call((a) => a.selectAll<SVGTextElement, unknown>(".tick text")
          .attr("fill", "#71717a")
          .attr("font-size", 9));

      ax.append("text")
        .attr("y", -14)
        .attr("text-anchor", "middle")
        .attr("fill", "#a1a1aa")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text(dim);
    });
  }, [data, dims]);

  if (!data?.data?.length || !data?.dimensions?.length) return (
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
