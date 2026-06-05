"use client";

import { useRef, useEffect, useState } from "react";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { min, max } from "d3-array";
import cloud from "d3-cloud";
import type { WordCloudData } from "@/lib/types/visualization";

interface WordCloudProps {
  data: WordCloudData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316","#6366f1","#14b8a6","#a78bfa","#34d399"];

interface LayoutWord {
  text: string;
  size: number;
  x?: number;
  y?: number;
  rotate?: number;
  font?: string;
}

export default function WordCloud({ data }: WordCloudProps) {
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

  useEffect(() => {
    if (!svgRef.current || !data?.words?.length) return;
    const { w, h } = dims;
    const words = data.words;

    const vals = words.map((ww) => ww.value);
    const minVal = min(vals) ?? 1;
    const maxVal = max(vals) ?? 1;
    const sizeScale = scaleLinear<number>()
      .domain([minVal, maxVal])
      .range([14, Math.min(64, w / 8)]);

    const layout = cloud<LayoutWord>()
      .size([w, h])
      .words(words.map((ww) => ({ text: ww.text, size: sizeScale(ww.value) })))
      .padding(6)
      .rotate(() => (Math.random() > 0.75 ? 90 : 0))
      .font("Inter, ui-sans-serif")
      .fontSize((d) => d.size ?? 16)
      .on("end", draw);

    layout.start();

    function draw(placed: LayoutWord[]) {
      if (!svgRef.current) return;
      const svg = select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);

      g.selectAll<SVGTextElement, LayoutWord>("text")
        .data(placed)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Inter, ui-sans-serif")
        .style("font-weight", "700")
        .style("fill", (_: LayoutWord, i: number) => COLORS[i % COLORS.length])
        .style("fill-opacity", "0.85")
        .style("cursor", "default")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0}) rotate(${d.rotate ?? 0})`)
        .text((d) => d.text ?? "")
        .on("mouseenter", function (this: SVGTextElement) {
          select(this).style("fill-opacity", "1").style("filter", "brightness(1.3)");
        })
        .on("mouseleave", function (this: SVGTextElement) {
          select(this).style("fill-opacity", "0.85").style("filter", "none");
        });
    }

    return () => { layout.stop(); };
  }, [data, dims]);

  if (!data?.words?.length) return (
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
