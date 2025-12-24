"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { WordCloudData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";

interface WordCloudProps {
  data: WordCloudData;
  readOnly?: boolean;
}

const COLORS = [
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export default function WordCloud({ data }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !data.words.length) return;

    // Use ResizeObserver to ensure we get correct dimensions
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0] || !containerRef.current || !svgRef.current) return;

      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;

      // Clear previous
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Scale font size based on value
      const maxValue = Math.max(...data.words.map((w) => w.value));
      const fontSizeScale = d3.scaleLinear().domain([0, maxValue]).range([14, 80]);

      // Random Color Picker
      const getColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

      const layout = cloud()
        .size([width, height])
        .words(
          data.words.map((d) => ({
            text: d.text,
            size: fontSizeScale(d.value),
            color: getColor(),
          }))
        )
        .padding(5)
        .rotate(() => (Math.random() > 0.5 ? 0 : 90))
        .font("Inter")
        .fontSize((d: any) => d.size)
        .on("end", draw);

      layout.start();

      function draw(words: any[]) {
        const g = svg
          .append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

        g.selectAll("text")
          .data(words)
          .join("text")
          .style("font-size", (d: any) => `${d.size}px`)
          .style("font-family", "Inter, sans-serif")
          .style("font-weight", "bold")
          .style("fill", (d: any) => d.color)
          .style("cursor", "pointer")
          .style("transition", "all 0.3s ease")
          .attr("text-anchor", "middle")
          .attr("transform", (d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text((d: any) => d.text)
          .on("mouseover", function (event, d: any) {
            d3.select(this)
              .style("fill", "#fff")
              .style("filter", `drop-shadow(0 0 10px ${d.color})`)
              .style("font-size", `${d.size * 1.1}px`);
          })
          .on("mouseout", function (event, d: any) {
            d3.select(this)
              .style("fill", d.color)
              .style("filter", "none")
              .style("font-size", `${d.size}px`);
          });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <VisualizationContainer>
      <div ref={containerRef} className="w-full h-full p-4 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </VisualizationContainer>
  );
}
