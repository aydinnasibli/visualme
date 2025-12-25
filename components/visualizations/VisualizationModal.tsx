"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Send, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { NetworkGraphHandle } from "./NetworkGraph";
import MindMapVisualization, { MindMapHandle } from "./MindMap";
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
  const networkGraphRef = useRef<NetworkGraphHandle>(null);
  const mindMapRef = useRef<MindMapHandle>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(visualization);
  const [editTab, setEditTab] = useState<'ai' | 'manual'>('ai');
  const [manualEditJson, setManualEditJson] = useState('');

  // Sync currentVisualization with visualization prop
  useEffect(() => {
    setCurrentVisualization(visualization);
  }, [visualization]);

  if (!currentVisualization) return null;

  const handleAIEdit = async () => {
    if (!editPrompt.trim()) {
      toast.error("Please enter what you'd like to change");
      return;
    }

    setIsEditing(true);

    try {
      const response = await fetch("/api/visualizations/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualizationId: currentVisualization._id,
          editPrompt: editPrompt.trim(),
          existingData: currentVisualization.data,
          visualizationType: currentVisualization.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit visualization");
      }

      const { visualization: updatedViz } = await response.json();

      setCurrentVisualization(updatedViz);
      setEditPrompt("");
      setIsEditMode(false);

      toast.success("Visualization updated successfully!");

      if (onVisualizationUpdated) {
        onVisualizationUpdated(updatedViz);
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to edit visualization");
    } finally {
      setIsEditing(false);
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

      // Update in database using the edit API
      const response = await fetch("/api/visualizations/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualizationId: currentVisualization._id,
          editPrompt: "Manual JSON edit",
          existingData: parsedData,
          visualizationType: currentVisualization.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update visualization");
      }

      const { visualization: updatedViz } = await response.json();

      setCurrentVisualization(updatedViz);
      setManualEditJson('');
      setIsEditMode(false);

      toast.success('Visualization updated successfully!');

      if (onVisualizationUpdated) {
        onVisualizationUpdated(updatedViz);
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
    setEditPrompt('');
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
                onClick={handleEditModeToggle}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isEditMode
                    ? "bg-primary text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditMode ? "Cancel Edit" : "Edit"}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Edit Mode UI */}
          {isEditMode && (
            <div className="px-6 pt-4 pb-2 border-b border-zinc-800 bg-zinc-900/50">
              {/* Edit Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setEditTab('ai')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    editTab === 'ai'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-white'
                  }`}
                >
                  AI Edit
                </button>
                <button
                  onClick={() => setEditTab('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    editTab === 'manual'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Manual Edit
                </button>
              </div>

              {/* AI Edit Tab */}
              {editTab === 'ai' && (
                <div>
                  <div className="flex gap-3 mb-2">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAIEdit();
                        }
                      }}
                      placeholder="What would you like to change? (e.g., 'add a new task for testing', 'change the color scheme', 'add more nodes')"
                      className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      disabled={isEditing}
                    />
                    <button
                      onClick={handleAIEdit}
                      disabled={isEditing || !editPrompt.trim()}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition flex items-center gap-2 font-medium"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Use natural language to describe your changes. The AI will update your visualization accordingly.
                  </p>
                </div>
              )}

              {/* Manual Edit Tab */}
              {editTab === 'manual' && (
                <div>
                  <div className="mb-2">
                    <textarea
                      value={manualEditJson}
                      onChange={(e) => setManualEditJson(e.target.value)}
                      className="w-full h-64 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
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
            </div>
          )}

          {/* Visualization Content */}
          <div className="flex-1 overflow-auto p-6">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
