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

    // Enhanced color scheme based on depth
    const colorScheme = [
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#06b6d4', // Cyan
    ];

    // Create or update markmap with enhanced options
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        color: (node) => {
          return colorScheme[node.state.depth % colorScheme.length];
        },
        duration: 600,
        maxWidth: 350,
        nodeMinHeight: 20,
        spacingVertical: 12,
        spacingHorizontal: 100,
        paddingX: 12,
        zoom: true,
        pan: true,
        initialExpandLevel: 3,
        autoFit: true,
        style: (id) => {
          return `
            #${id} {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 16px;
              font-weight: 500;
            }
            #${id} a {
              color: inherit;
              text-decoration: none;
              transition: all 0.2s;
            }
            #${id} a:hover {
              opacity: 0.8;
            }
            #${id} .markmap-node > circle {
              transition: all 0.3s;
              stroke-width: 2px;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            }
            #${id} .markmap-node:hover > circle {
              stroke-width: 3px;
              filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
            }
            #${id} .markmap-link {
              stroke-width: 2.5px;
              opacity: 0.6;
              transition: all 0.3s;
            }
            #${id} .markmap-link:hover {
              opacity: 1;
              stroke-width: 3px;
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
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[650px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          backgroundColor: 'transparent',
        }}
      />
    </motion.div>
  );
});

MindMapVisualization.displayName = 'MindMapVisualization';

export default MindMapVisualization;
