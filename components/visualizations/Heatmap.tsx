"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleSequential } from "d3-scale";
import { interpolate } from "d3-interpolate";
import { min, max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import type { HeatmapData } from "@/lib/types/visualization";

interface HeatmapProps {
  data: HeatmapData;
  readOnly?: boolean;
}

export default function Heatmap({ data }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { xs, ys } = useMemo(() => {
    const cells = data?.data || [];
    return {
      xs: Array.from(new Set(cells.map((c) => String(c.x)))),
      ys: Array.from(new Set(cells.map((c) => String(c.y)))),
    };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !data?.data?.length) return;
    const { w, h } = dims;
    const pad = { top: 30, right: 30, bottom: 60, left: 70 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${pad.left},${pad.top})`);

    const xScale = scaleBand<string>().domain(xs).range([0, innerW]).padding(0.05);
    const yScale = scaleBand<string>().domain(ys).range([0, innerH]).padding(0.05);

    const values = data.data.map((c) => c.value);
    const minV = min(values) ?? 0;
    const maxV = max(values) ?? 1;
    const colorScale = scaleSequential<string>()
      .domain([minV, maxV])
      .interpolator(interpolate("#1e1b4b", "#8b5cf6"));

    // Tooltip
    const tooltip = select(containerRef.current!)
      .selectAll<HTMLDivElement, null>(".hm-tip")
      .data([null])
      .join("div")
      .attr("class", "hm-tip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(9,9,11,0.95)")
      .style("border", "1px solid rgba(82,82,91,0.6)")
      .style("border-radius", "10px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("color", "#e4e4e7")
      .style("opacity", "0")
      .style("z-index", "50")
      .style("transition", "opacity 0.15s");

    // Cells
    g.selectAll<SVGRectElement, (typeof data.data)[0]>("rect")
      .data(data.data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(String(d.x)) ?? 0)
      .attr("y", (d) => yScale(String(d.y)) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 3)
      .attr("fill", (d) => colorScale(d.value))
      .attr("opacity", 0.9)
      .on("mouseenter", function (event: MouseEvent, d) {
        select(this).attr("stroke", "#fff").attr("stroke-width", 1.5).attr("opacity", 1);
        tooltip
          .style("opacity", "1")
          .html(`<strong>${d.x} × ${d.y}</strong><br/>Value: ${d.value}`)
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function () {
        select(this).attr("stroke", "none").attr("opacity", 0.9);
        tooltip.style("opacity", "0");
      });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(axisBottom(xScale).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", 11)
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
      .attr("dy", "0.5em");

    // Y axis
    g.append("g")
      .call(axisLeft(yScale).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", 11);
  }, [data, dims, xs, ys]);

  if (!data?.data?.length) return (
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
