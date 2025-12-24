"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ParallelCoordinatesData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface ParallelCoordinatesProps {
  data: ParallelCoordinatesData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

export default function ParallelCoordinates({ data }: ParallelCoordinatesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const margin = { top: 30, right: 10, bottom: 10, left: 0 };

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Extract dimensions keys
    const dimensions = data.dimensions;

    // Build yScales for each dimension
    const yScales: any = {};
    dimensions.forEach((dim) => {
      // @ts-ignore - d3 types issue with scaleLinear
      yScales[dim] = d3
        .scaleLinear()
        .domain(d3.extent(data.data, (d: any) => d[dim]) as [number, number])
        .range([innerHeight, 0]);
    });

    // Build xScale for dimensions
    const x = d3.scalePoint().range([0, innerWidth]).padding(1).domain(dimensions);

    // Line generator
    const line = (d: any) =>
      d3.line()(
        dimensions.map((p) => [x(p)!, yScales[p](d[p])])
      );

    // Draw lines
    g.selectAll("myPath")
      .data(data.data)
      .join("path")
      .attr("d", line as any)
      .style("fill", "none")
      .style("stroke", (d, i) => COLORS[i % COLORS.length])
      .style("stroke-width", 1.5)
      .style("opacity", 0.6)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .style("stroke-width", 4)
          .style("opacity", 1)
          .style("filter", `drop-shadow(0 0 5px ${d3.select(this).style("stroke")})`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("stroke-width", 1.5)
          .style("opacity", 0.6)
          .style("filter", "none");
      });

    // Draw axes
    g.selectAll("myAxis")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x(d)},0)`)
      .each(function (d) {
        d3.select(this).call(d3.axisLeft(yScales[d]).ticks(5));
      })
      .call((g) => g.selectAll("text")
          .style("fill", "#a1a1aa")
          .style("font-size", "10px")
      )
      .call((g) => g.selectAll("line").style("stroke", "#3f3f46"))
      .call((g) => g.selectAll("path").style("stroke", "#3f3f46"))
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text((d) => d)
      .style("fill", "#e4e4e7")
      .style("font-weight", "bold")
      .style("font-size", "12px");

  }, [data]);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-6 bg-[#0f1419]">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
    </VisualizationContainer>
  );
}
