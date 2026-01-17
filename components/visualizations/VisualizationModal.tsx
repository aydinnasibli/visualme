"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Send, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { NetworkGraphHandle } from "./NetworkGraph";
import MindMapVisualization, { MindMapHandle } from "./MindMap";
import { editVisualizationAction } from "@/lib/actions/visualize";
import type { SavedVisualization } from "@/lib/types/visualization";
import { toast } from "sonner";

const DynamicNetworkGraph = dynamic(() => import("./NetworkGraph"), {
  ssr: false,
});
const DynamicTreeDiagram = dynamic(() => import("./TreeDiagram"), {
  ssr: false,
});
const DynamicTimeline = dynamic(() => import("./Timeline"), {
  ssr: false,
});

const DynamicGanttChart = dynamic(() => import("./GanttChart"), {
  ssr: false,
});

interface VisualizationModalProps {
  visualization: SavedVisualization | null;
  onClose: () => void;
  onVisualizationUpdated?: (updatedVisualization: SavedVisualization) => void;
}

export default function VisualizationModal({
  visualization,
  onClose,
  onVisualizationUpdated,
}: VisualizationModalProps) {
  const router = useRouter();
  const networkGraphRef = useRef<NetworkGraphHandle>(null);
  const mindMapRef = useRef<MindMapHandle>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(visualization);
  const [manualEditJson, setManualEditJson] = useState('');

  // Sync currentVisualization with visualization prop
  useEffect(() => {
    setCurrentVisualization(visualization);
  }, [visualization]);

  if (!currentVisualization) return null;

  const handleRevisualize = () => {
    try {
      // Store current visualization in sessionStorage to pass to dashboard
      sessionStorage.setItem('revisualize_data', JSON.stringify(currentVisualization));
      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to store visualization data:", error);
      toast.error("Failed to prepare visualization for editing");
    }
  };

  const handleManualEdit = async () => {
    if (!manualEditJson.trim()) {
      toast.error('Please enter valid JSON data');
      return;
    }

    try {
      const parsedData = JSON.parse(manualEditJson);

      if (!currentVisualization) return;

      // Update in database using the server action
      const response = await editVisualizationAction(
        "Manual JSON edit",
        parsedData,
        currentVisualization.type,
        currentVisualization._id
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update visualization");
      }

      const updatedViz = response.visualization;

      if (updatedViz) {
        setCurrentVisualization(updatedViz);
        setManualEditJson('');
        setIsEditMode(false);
        toast.success('Visualization updated successfully!');

        if (onVisualizationUpdated) {
          onVisualizationUpdated(updatedViz);
        }
      } else {
         // Should not happen for manual edit with ID
         throw new Error("Failed to retrieve updated visualization");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format. Please check your data.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to update visualization');
      }
    }
  };

  const handleEditModeToggle = () => {
    if (!isEditMode && currentVisualization) {
      // When opening edit mode, populate manual edit JSON
      setManualEditJson(JSON.stringify(currentVisualization.data, null, 2));
    }
    setIsEditMode(!isEditMode);
  };

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
                {currentVisualization.title}
              </h2>
              <p className="text-sm text-zinc-400 capitalize">
                {currentVisualization.type.replace(/_/g, " ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevisualize}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition flex items-center gap-2 font-medium"
              >
                Revisualize
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleEditModeToggle}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isEditMode
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditMode ? "Close Manual Edit" : "Manual Edit"}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Manual Edit Mode UI */}
              {isEditMode && (
                <div className="px-6 pt-4 pb-2 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="mb-2">
                    <textarea
                      value={manualEditJson}
                      onChange={(e) => setManualEditJson(e.target.value)}
                      className="w-full h-48 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                      placeholder="Edit the JSON data directly..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                      Edit the JSON structure directly. Make sure to maintain valid JSON format.
                    </p>
                    <button
                      onClick={handleManualEdit}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition flex items-center gap-2 font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Apply Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Visualization Content */}
              <div className="flex-1 overflow-auto p-6 bg-[#0f1419]/50">
            {currentVisualization.type === "network_graph" && (
              <DynamicNetworkGraph
                ref={networkGraphRef}
                data={currentVisualization.data as any}
                readOnly={true}
              />
            )}

            {currentVisualization.type === "gantt_chart" && (
              <DynamicGanttChart
                data={currentVisualization.data as any}
              />
            )}

            {currentVisualization.type === "mind_map" && (
              <MindMapVisualization
                ref={mindMapRef}
                data={currentVisualization.data as any}
                readOnly={true}
              />
            )}

            {currentVisualization.type === "tree_diagram" && (
              <DynamicTreeDiagram
                data={currentVisualization.data as any}
                readOnly={true}
              />
            )}

            {currentVisualization.type === "timeline" && (
              <DynamicTimeline
                data={currentVisualization.data as any}
                readOnly={true}
              />
            )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
