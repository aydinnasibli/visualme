"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { NetworkGraphHandle } from "./NetworkGraph";
import MindMapVisualization, { MindMapHandle } from "./MindMap";
import type { SavedVisualization } from "@/lib/types/visualization";

const DynamicNetworkGraph = dynamic(() => import("./NetworkGraph"), {
  ssr: false,
});
const DynamicTreeDiagram = dynamic(() => import("./TreeDiagram"), {
  ssr: false,
});
const DynamicTimeline = dynamic(() => import("./Timeline"), {
  ssr: false,
});

interface VisualizationModalProps {
  visualization: SavedVisualization | null;
  onClose: () => void;
}

export default function VisualizationModal({
  visualization,
  onClose,
}: VisualizationModalProps) {
  const networkGraphRef = useRef<NetworkGraphHandle>(null);
  const mindMapRef = useRef<MindMapHandle>(null);

  if (!visualization) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {visualization.title}
              </h2>
              <p className="text-sm text-zinc-400 capitalize">
                {visualization.type.replace(/_/g, " ")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Visualization Content */}
          <div className="flex-1 overflow-auto p-6">
            {visualization.type === "network_graph" && (
              <DynamicNetworkGraph
                ref={networkGraphRef}
                data={visualization.data as any}
                readOnly={true}
              />
            )}

            {visualization.type === "mind_map" && (
              <MindMapVisualization
                ref={mindMapRef}
                data={visualization.data as any}
                readOnly={true}
              />
            )}

            {visualization.type === "tree_diagram" && (
              <DynamicTreeDiagram
                data={visualization.data as any}
                readOnly={true}
              />
            )}

            {visualization.type === "timeline" && (
              <DynamicTimeline
                data={visualization.data as any}
                readOnly={true}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
