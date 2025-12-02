'use client';

import React, { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { motion } from 'framer-motion';

interface MindMapProps {
  markdown: string;
}

export default function MindMapVisualization({ markdown }: MindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Transform markdown to markmap data
    const transformer = new Transformer();
    const { root } = transformer.transform(markdown);

    // Create or update markmap
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(svgRef.current, {
        color: (node) => {
          // Color based on depth
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
          return colors[node.state.depth % colors.length];
        },
        duration: 500,
        maxWidth: 300,
        nodeMinHeight: 16,
        spacingVertical: 10,
        spacingHorizontal: 80,
        paddingX: 8,
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          backgroundColor: '#111827',
        }}
      />
    </motion.div>
  );
}
