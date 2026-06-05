"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Send, ArrowRight, Download, FileJson, FileSpreadsheet, FileCode, Globe, Share2, ImageIcon, Code2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { NetworkGraphHandle } from "./NetworkGraph";
import { MindMapHandle } from "./MindMap";
import { editVisualizationAction } from "@/lib/actions/visualize";
import { exportVisualization, createShareLink } from "@/lib/actions/export";
import type { SavedVisualization } from "@/lib/types/visualization";
import { toast } from "sonner";
import { VisualizationErrorBoundary } from "@/components/VisualizationErrorBoundary";

const DynLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);
const dyn = (fn: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(fn, { ssr: false, loading: DynLoader });

const DynamicNetworkGraph = dyn(() => import("./NetworkGraph"));
const DynamicMindMap = dyn(() => import("./MindMap"));
const DynamicTreeDiagram = dyn(() => import("./TreeDiagram"));
const DynamicTimeline = dyn(() => import("./Timeline"));
const DynamicGanttChart = dyn(() => import("./GanttChart"));
const DynamicAnimatedTimeline = dyn(() => import("./AnimatedTimeline"));
const DynamicFlowchart = dyn(() => import("./Flowchart"));
const DynamicSankeyDiagram = dyn(() => import("./SankeyDiagram"));
const DynamicSwimlaneDiagram = dyn(() => import("./SwimlaneDiagram"));
const DynamicLineChart = dyn(() => import("./LineChart"));
const DynamicBarChart = dyn(() => import("./BarChart"));
const DynamicScatterPlot = dyn(() => import("./ScatterPlot"));
const DynamicHeatmap = dyn(() => import("./Heatmap"));
const DynamicRadarChart = dyn(() => import("./RadarChart"));
const DynamicPieChart = dyn(() => import("./PieChart"));
const DynamicComparisonTable = dyn(() => import("./ComparisonTable"));
const DynamicParallelCoords = dyn(() => import("./ParallelCoordinates"));
const DynamicWordCloud = dyn(() => import("./WordCloud"));
const DynamicSyntaxDiagram = dyn(() => import("./SyntaxDiagram"));

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
  const [exportOpen, setExportOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(visualization?.isPublic ?? false);
  const [shareId, setShareId] = useState(visualization?.shareId ?? null);

  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-export-menu]')) setExportOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  // Sync currentVisualization with visualization prop
  useEffect(() => {
    setCurrentVisualization(visualization);
  }, [visualization]);

  if (!currentVisualization) return null;

  const handleExportData = async (format: 'json' | 'csv' | 'html') => {
    if (!currentVisualization?._id) return;
    try {
      const res = await exportVisualization(currentVisualization._id, format, { includeMetadata: true, title: currentVisualization.title });
      if (!res.success || !res.data) { toast.error(res.error || 'Export failed'); return; }
      const blob = new Blob([res.data.content], { type: res.data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleExportPNG = async () => {
    const area = document.querySelector('[data-viz-area]') as HTMLElement;
    if (!area) { toast.error('Could not capture visualization'); return; }
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(area, { backgroundColor: '#0f1419', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${currentVisualization?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'visualization'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Exported as PNG');
    } catch { toast.error('PNG export failed'); }
  };

  const handleShare = async () => {
    if (!currentVisualization?._id) return;
    try {
      if (isPublic && shareId) {
        const url = `${window.location.origin}/share/${shareId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Public link copied!');
        return;
      }
      const res = await createShareLink(currentVisualization._id, { isPublic: true });
      if (!res.success || !res.data) { toast.error(res.error || 'Failed to create share link'); return; }
      setIsPublic(true);
      setShareId(res.data.shareId);
      await navigator.clipboard.writeText(res.data.shareUrl);
      toast.success('Public link created and copied!');
    } catch { toast.error('Failed to share'); }
  };

  const handleRevisualize = () => {
    try {
      // Store current visualization in sessionStorage to pass to dashboard
      sessionStorage.setItem('revisualize_data', JSON.stringify(currentVisualization));
      router.push('/dashboard');
    } catch {
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
                onClick={handleShare}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${isPublic ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                title={isPublic ? 'Copy public link' : 'Make public & copy link'}
              >
                {isPublic ? <Globe className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {isPublic ? 'Public' : 'Share'}
              </button>

              {/* Export dropdown */}
              <div className="relative" data-export-menu>
                <button
                  onClick={() => setExportOpen(p => !p)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <AnimatePresence>
                  {exportOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50"
                      style={{ background: '#131b26', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                      data-export-menu
                    >
                      <button onClick={handleExportPNG} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors">
                        <ImageIcon size={13} className="text-blue-400" /> Export as PNG
                      </button>
                      <div className="h-px bg-white/[0.06] mx-3 my-1" />
                      <button onClick={() => { setExportOpen(false); handleExportData('json'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors">
                        <FileJson size={13} className="text-amber-400" /> Export as JSON
                      </button>
                      <button onClick={() => { setExportOpen(false); handleExportData('csv'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors">
                        <FileSpreadsheet size={13} className="text-emerald-400" /> Export as CSV
                      </button>
                      <button onClick={() => { setExportOpen(false); handleExportData('html'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors">
                        <FileCode size={13} className="text-cyan-400" /> Export as HTML
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleRevisualize}
                className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition flex items-center gap-2 text-sm font-medium"
              >
                Revisualize
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleEditModeToggle}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${isEditMode ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditMode ? "Close Edit" : "Edit JSON"}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white">
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
              <div className="flex-1 overflow-auto p-6 bg-[#0f1419]/50" data-viz-area>
                <VisualizationErrorBoundary>
                {currentVisualization.type === "network_graph" && (
                  <DynamicNetworkGraph ref={networkGraphRef} data={currentVisualization.data as any} readOnly={true} />
                )}
                {currentVisualization.type === "mind_map" && (
                  <DynamicMindMap ref={mindMapRef} data={currentVisualization.data as any} readOnly={true} />
                )}
                {currentVisualization.type === "tree_diagram" && (
                  <DynamicTreeDiagram data={currentVisualization.data as any} readOnly={true} />
                )}
                {currentVisualization.type === "timeline" && (
                  <DynamicTimeline data={currentVisualization.data as any} readOnly={true} />
                )}
                {currentVisualization.type === "gantt_chart" && (
                  <DynamicGanttChart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "animated_timeline" && (
                  <DynamicAnimatedTimeline data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "flowchart" && (
                  <DynamicFlowchart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "sankey_diagram" && (
                  <DynamicSankeyDiagram data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "swimlane_diagram" && (
                  <DynamicSwimlaneDiagram data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "line_chart" && (
                  <DynamicLineChart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "bar_chart" && (
                  <DynamicBarChart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "scatter_plot" && (
                  <DynamicScatterPlot data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "heatmap" && (
                  <DynamicHeatmap data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "radar_chart" && (
                  <DynamicRadarChart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "pie_chart" && (
                  <DynamicPieChart data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "comparison_table" && (
                  <DynamicComparisonTable data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "parallel_coordinates" && (
                  <DynamicParallelCoords data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "word_cloud" && (
                  <DynamicWordCloud data={currentVisualization.data as any} />
                )}
                {currentVisualization.type === "syntax_diagram" && (
                  <DynamicSyntaxDiagram data={currentVisualization.data as any} />
                )}
                </VisualizationErrorBoundary>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
