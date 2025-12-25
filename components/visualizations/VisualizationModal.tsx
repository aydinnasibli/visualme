"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Send, Loader2, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { NetworkGraphHandle } from "./NetworkGraph";
import MindMapVisualization, { MindMapHandle } from "./MindMap";
import ChatSidebar from "./ChatSidebar";
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
  const [isChatOpen, setIsChatOpen] = useState(false); // New state for chat sidebar
  const [isEditing, setIsEditing] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(visualization);
  const [editTab, setEditTab] = useState<'ai' | 'manual'>('ai');
  const [manualEditJson, setManualEditJson] = useState('');

  // Chat history state
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date | string}>>([]);

  // Sync currentVisualization with visualization prop and load history
  useEffect(() => {
    setCurrentVisualization(visualization);
    if (visualization?.history) {
      setChatHistory(visualization.history);
    }
  }, [visualization]);

  if (!currentVisualization) return null;

  const handleSendMessage = async (message: string) => {
    setIsEditing(true);

    // Optimistically add user message to chat
    const newHistory = [
      ...chatHistory,
      { role: 'user' as const, content: message, timestamp: new Date() }
    ];
    setChatHistory(newHistory);

    try {
      const response = await fetch("/api/visualizations/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualizationId: currentVisualization._id,
          editPrompt: message.trim(),
          existingData: currentVisualization.data,
          visualizationType: currentVisualization.type,
          messages: newHistory // Pass history if needed by backend for future expansions
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit visualization");
      }

      const { visualization: updatedViz } = await response.json();

      setCurrentVisualization(updatedViz);

      // Update history with AI response
      setChatHistory([
        ...newHistory,
        { role: 'assistant' as const, content: 'I have updated the visualization based on your request.', timestamp: new Date() }
      ]);

      toast.success("Visualization updated successfully!");

      if (onVisualizationUpdated) {
        onVisualizationUpdated(updatedViz);
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to edit visualization");

      // Remove the optimistic user message on error or add error message
      setChatHistory([
        ...newHistory,
        { role: 'assistant' as const, content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp: new Date() }
      ]);
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
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isChatOpen
                    ? "bg-primary text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {isChatOpen ? "Close Chat" : "AI Chat"}
              </button>

              <button
                onClick={handleEditModeToggle}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isEditMode
                    ? "bg-primary text-white"
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

            {/* Chat Sidebar */}
            <AnimatePresence mode="wait">
              {isChatOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-zinc-800"
                >
                  <ChatSidebar
                    initialHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    isProcessing={isEditing}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
