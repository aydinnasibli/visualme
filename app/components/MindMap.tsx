"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

interface MindMapProps {
  markdown: string;
}

export interface MindMapHandle {
  exportPNG: (scale?: number) => Promise<void>;
  exportSVG: () => Promise<void>;
  getMarkdown: () => string;
}

const MindMapVisualization = forwardRef<MindMapHandle, MindMapProps>(
  ({ markdown }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const markmapRef = useRef<Markmap | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Export functionality
    // Expose export methods via ref
    useImperativeHandle(
      ref,
      () => ({
        exportPNG: async (scale = 2) => {
          if (!svgRef.current) throw new Error("SVG element not found");

          // 1. Get the current computed dimensions of the live SVG
          const { width, height } = svgRef.current.getBoundingClientRect();

          // 2. Clone the node so we don't mess up the live UI
          const clone = svgRef.current.cloneNode(true) as SVGSVGElement;

          // 3. HARDCODE the dimensions on the clone to prevent "relative length" errors
          clone.setAttribute("width", `${width}`);
          clone.setAttribute("height", `${height}`);

          // 4. Serialize the Fixed Clone
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(clone);

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context not available");

          const svgBlob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);

          const img = new Image();
          img.onload = () => {
            // Set canvas size to scaled dimensions
            canvas.width = width * scale;
            canvas.height = height * scale;

            ctx.scale(scale, scale);
            ctx.fillStyle = "#09090b"; // Match your dark theme background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
              if (!blob) return;
              const link = document.createElement("a");
              link.download = `mind-map-${Date.now()}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(url);
            });
          };
          img.src = url;
        },
        exportSVG: async () => {
          if (!svgRef.current) throw new Error("SVG element not found");

          // 1. Get dimensions
          const { width, height } = svgRef.current.getBoundingClientRect();

          // 2. Clone and fix dimensions
          const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
          clone.setAttribute("width", `${width}`);
          clone.setAttribute("height", `${height}`);

          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(clone);
          const blob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
          });

          const link = document.createElement("a");
          link.download = `mind-map-${Date.now()}.svg`;
          link.href = URL.createObjectURL(blob);
          link.click();
        },
        getMarkdown: () => markdown,
      }),
      [markdown]
    );

    // Initialize and Update Markmap
    useEffect(() => {
      if (!svgRef.current) return;

      const transformer = new Transformer();
      const { root } = transformer.transform(markdown);

      if (!markmapRef.current) {
        markmapRef.current = Markmap.create(svgRef.current, {
          autoFit: true,
          duration: 500,
          style: (id) => `
          ${id} { font-family: Inter, ui-sans-serif, system-ui; }
          ${id} text { fill: #e4e4e7; font-size: 14px; }
          ${id} circle { stroke-width: 3px; }
          ${id} path { stroke: #52525b; stroke-width: 2px; }
        `,
        });
      }

      markmapRef.current.setData(root);
      // Force fit after slight delay to allow rendering
      setTimeout(() => markmapRef.current?.fit(), 100);
    }, [markdown]);

    // Handle Window Resizing
    useEffect(() => {
      if (!containerRef.current || !markmapRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        markmapRef.current?.fit();
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-[750px] bg-zinc-950 rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden group"
      >
        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => markmapRef.current?.fit()}
            className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 backdrop-blur-sm transition-colors"
          >
            Reset View
          </button>
        </div>

        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ backgroundColor: "transparent" }}
        />
      </div>
    );
  }
);

MindMapVisualization.displayName = "MindMapVisualization";

export default MindMapVisualization;
