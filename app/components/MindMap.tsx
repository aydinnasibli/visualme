'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { motion } from 'framer-motion';

interface MindMapProps {
  markdown: string;
}

export interface MindMapHandle {
  exportPNG: (scale?: number) => Promise<void>;
  exportSVG: () => Promise<void>;
  getMarkdown: () => string;
}

const MindMapVisualization = forwardRef<MindMapHandle, MindMapProps>(({ markdown }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose export methods via ref
  useImperativeHandle(ref, () => ({
    exportPNG: async (scale = 2) => {
      if (!svgRef.current) {
        throw new Error('SVG element not found');
      }

      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement('a');
          link.download = `mind-map-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(url);
        });
      };
      img.src = url;
    },
    exportSVG: async () => {
      if (!svgRef.current) {
        throw new Error('SVG element not found');
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

      const link = document.createElement('a');
      link.download = `mind-map-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    },
    getMarkdown: () => markdown,
  }), [markdown]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Transform markdown to markmap data
    const transformer = new Transformer();
    const { root } = transformer.transform(markdown);

    // Enhanced color scheme with better contrast - Obsidian inspired
    const colorScheme = [
      '#60a5fa', // Bright Blue
      '#a78bfa', // Bright Purple
      '#f472b6', // Bright Pink
      '#fbbf24', // Bright Amber
      '#34d399', // Bright Emerald
      '#22d3ee', // Bright Cyan
    ];

    // Create or update markmap with production-ready options
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        color: (node) => {
          return colorScheme[node.state.depth % colorScheme.length];
        },
        duration: 500,
        maxWidth: 500, // Increased for better readability
        nodeMinHeight: 30, // Increased for better spacing
        spacingVertical: 20, // More vertical space
        spacingHorizontal: 140, // More horizontal space
        paddingX: 16, // More padding
        zoom: true,
        pan: true,
        initialExpandLevel: 4, // Show more levels by default
        autoFit: true,
        style: (id) => {
          return `
            #${id} {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              font-size: 18px; /* Larger base font */
              font-weight: 600; /* Bolder for readability */
              line-height: 1.6;
            }
            #${id} a {
              color: inherit;
              text-decoration: none;
              transition: all 0.2s ease;
            }
            #${id} a:hover {
              opacity: 0.9;
              transform: scale(1.02);
            }
            #${id} .markmap-node > circle {
              transition: all 0.3s ease;
              stroke-width: 3px; /* Thicker circles */
              filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
            }
            #${id} .markmap-node:hover > circle {
              stroke-width: 4px;
              filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));
              transform: scale(1.15);
            }
            #${id} .markmap-link {
              stroke-width: 3px; /* Thicker links */
              opacity: 0.7;
              transition: all 0.3s ease;
            }
            #${id} .markmap-link:hover {
              opacity: 1;
              stroke-width: 4px;
            }
            /* Depth-based font sizing for hierarchy */
            #${id} g[data-depth="0"] text {
              font-size: 24px; /* Root node - largest */
              font-weight: 700;
            }
            #${id} g[data-depth="1"] text {
              font-size: 20px; /* Level 1 */
              font-weight: 600;
            }
            #${id} g[data-depth="2"] text {
              font-size: 17px; /* Level 2 */
              font-weight: 600;
            }
            #${id} g[data-depth="3"] text {
              font-size: 15px; /* Level 3 */
              font-weight: 500;
            }
          `;
        },
      });
    }

    markmapRef.current.setData(root);
    markmapRef.current.fit();

    return () => {
      if (markmapRef.current) {
        markmapRef.current.destroy();
        markmapRef.current = null;
      }
    };
  }, [markdown]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[750px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl shadow-black/50 animate-in fade-in duration-500"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
});

MindMapVisualization.displayName = 'MindMapVisualization';

export default MindMapVisualization;
