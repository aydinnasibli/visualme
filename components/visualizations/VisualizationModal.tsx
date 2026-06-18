"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Send, ArrowRight, Download, FileJson, FileSpreadsheet, FileCode, FileText, Globe, Share2, ImageIcon, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveVisualization } from "@/lib/actions/visualize";
import { exportVisualization, createShareLink } from "@/lib/actions/export";
import type { SavedVisualization } from "@/lib/types/visualization";
import { toast } from "sonner";
import { VisualizationErrorBoundary } from "@/components/VisualizationErrorBoundary";
import EChartsRenderer from "@/components/visualizations/EChartsRenderer";
import { exportCanvasAsPNG } from "@/lib/utils/export-png";
import { exportChartAsPDF } from "@/lib/utils/export-dashboard";

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
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(visualization);
  const [manualEditJson, setManualEditJson] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(visualization?.isPublic ?? false);
  const [shareId, setShareId] = useState(visualization?.shareId ?? null);

  /* Sync all derived state when prop changes */
  const [prevVisualization, setPrevVisualization] = useState(visualization);
  if (visualization !== prevVisualization) {
    setPrevVisualization(visualization);
    setCurrentVisualization(visualization);
    setIsPublic(visualization?.isPublic ?? false);
    setShareId(visualization?.shareId ?? null);
  }

  /* Escape key closes modal */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /* Close export dropdown only when clicking outside it */
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!currentVisualization) return;
    const el = modalRef.current;
    if (!el) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = el.querySelectorAll<HTMLElement>('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [currentVisualization]);

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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleExportPNG = async () => {
    const area = document.querySelector('[data-viz-area]') as HTMLElement;
    if (!area) { toast.error('Could not capture visualization'); return; }
    try {
      const filename = `${currentVisualization?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'visualization'}.png`;
      const ok = exportCanvasAsPNG(area, filename);
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PNG');
    } catch { toast.error('PNG export failed'); }
  };

  const handleExportPDF = async () => {
    const area = document.querySelector('[data-viz-area]') as HTMLElement;
    if (!area) { toast.error('Could not capture visualization'); return; }
    try {
      const ok = await exportChartAsPDF(area, currentVisualization?.title || 'visualization');
      if (!ok) { toast.error('No chart canvas found'); return; }
      toast.success('Exported as PDF');
    } catch { toast.error('PDF export failed'); }
  };

  const handleShare = async () => {
    if (!currentVisualization?._id) return;
    try {
      if (isPublic && shareId) {
        await navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
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
      sessionStorage.setItem('revisualize_data', JSON.stringify(currentVisualization));
      router.push('/dashboard');
    } catch {
      toast.error("Failed to prepare visualization for editing");
    }
  };

  const handleManualEdit = async () => {
    if (!manualEditJson.trim()) { toast.error('Please enter valid JSON data'); return; }
    try {
      const parsedOption = JSON.parse(manualEditJson);
      if (!currentVisualization) return;

      const newSpec = { ...currentVisualization.spec, option: parsedOption };

      /* Direct save — bypass AI, just persist the new spec */
      const response = await saveVisualization(
        currentVisualization.title,
        newSpec,
        { generatedAt: new Date(), aiModel: 'manual', originalInput: currentVisualization.metadata?.originalInput || '' },
        currentVisualization.isPublic ?? false,
        currentVisualization._id,
        currentVisualization.history as { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[] | undefined,
      );

      if (!response.success) throw new Error(response.error || 'Failed to update visualization');

      const updated: SavedVisualization = { ...currentVisualization, spec: newSpec };
      setCurrentVisualization(updated);
      setManualEditJson('');
      setIsEditMode(false);
      toast.success('Visualization updated!');
      onVisualizationUpdated?.(updated);
    } catch (error) {
      if (error instanceof SyntaxError) toast.error('Invalid JSON format.');
      else toast.error(error instanceof Error ? error.message : 'Failed to update visualization');
    }
  };

  const handleEditModeToggle = () => {
    if (!isEditMode && currentVisualization) setManualEditJson(JSON.stringify(currentVisualization.spec.option, null, 2));
    setIsEditMode(!isEditMode);
  };

  const viz = currentVisualization;

  return (
    <AnimatePresence>
      {viz && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          role="dialog"
          aria-modal="true"
          aria-label="Visualization details"
          className="surface-panel rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.35)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-edge">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-1">{viz.title}</h2>
              <p className="text-sm text-ink-faint flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Chart
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${
                  isPublic ? 'bg-success/15 text-success hover:bg-success/25' : 'surface-control text-ink-muted'
                }`}
                title={isPublic ? 'Copy public link' : 'Make public & copy link'}
              >
                {isPublic ? <Globe className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {isPublic ? 'Public' : 'Share'}
              </button>

              {/* Export dropdown — ref-scoped close */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setExportOpen(p => !p)}
                  className="px-3 py-2 rounded-lg surface-control text-ink-muted transition flex items-center gap-2 text-sm font-medium"
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
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50 surface-panel shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
                    >
                      <button onClick={handleExportPNG} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                        <ImageIcon size={13} className="text-blue-400" /> Export as PNG
                      </button>
                      <button onClick={() => { setExportOpen(false); handleExportPDF(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                        <FileText size={13} className="text-rose-400" /> Export as PDF
                      </button>
                      <div className="h-px bg-edge mx-3 my-1" />
                      <button onClick={() => { setExportOpen(false); handleExportData('json'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                        <FileJson size={13} className="text-amber-400" /> Export as JSON
                      </button>
                      <button onClick={() => { setExportOpen(false); handleExportData('csv'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                        <FileSpreadsheet size={13} className="text-emerald-400" /> Export as CSV
                      </button>
                      <button onClick={() => { setExportOpen(false); handleExportData('html'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                        <FileCode size={13} className="text-cyan-400" /> Export as HTML
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleRevisualize}
                className="px-3 py-2 rounded-lg bg-accent text-surface-0 hover:bg-accent-hover transition flex items-center gap-2 text-sm font-medium"
              >
                Revisualize <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleEditModeToggle}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${
                  isEditMode ? "bg-surface-3 text-ink" : "surface-control text-ink-muted"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditMode ? "Close Edit" : "Edit JSON"}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-lg transition text-ink-faint hover:text-ink">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              {/* Manual Edit Mode */}
              {isEditMode && (
                <div className="px-6 pt-4 pb-2 border-b border-edge bg-surface-2/40">
                  <textarea
                    value={manualEditJson}
                    onChange={(e) => setManualEditJson(e.target.value)}
                    className="w-full h-48 px-4 py-3 bg-surface-2 border border-edge rounded-lg text-ink font-mono text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none mb-2"
                    placeholder="Edit the chart's ECharts option JSON directly..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-faint">Edit the ECharts option JSON directly. Maintain valid JSON format.</p>
                    <button
                      onClick={handleManualEdit}
                      className="px-6 py-3 bg-accent hover:bg-accent-hover text-surface-0 rounded-lg transition flex items-center gap-2 font-medium"
                    >
                      <Send className="w-4 h-4" /> Apply Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Visualization Content */}
              <div className="flex-1 overflow-hidden min-h-0 relative bg-surface-0" data-viz-area>
                <VisualizationErrorBoundary>
                  <EChartsRenderer spec={viz.spec} className="w-full h-full p-6" />
                </VisualizationErrorBoundary>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
