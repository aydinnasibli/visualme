'use client';

import React, { useState, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import {
  generateVisualization, saveVisualization, editVisualizationAction, getVisualizationById,
} from '@/lib/actions/visualize';
import { exportVisualization, createShareLink } from '@/lib/actions/export';
import type { SavedVisualization } from '@/lib/types/visualization';
import type { BrandTheme } from '@/lib/types/echarts-spec';
import { readFileAttachment, composePromptWithAttachment, type FileAttachment } from '@/lib/utils/file-attachment';
import { composePromptWithChartType, getStyleEffect, type ChartSelection } from '@/lib/utils/chart-types';
import { toast } from 'sonner';

import Header from '@/components/dashboard/Header';
import VizThread, { type ThreadEntry } from '@/components/dashboard/VizThread';
import FocusPanel from '@/components/dashboard/FocusPanel';
import StatisticsModal from '@/components/dashboard/StatisticsModal';
import { Sigma } from 'lucide-react';

/* ── Helpers ── */
const Loading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
  </div>
);

function genId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

/* ── Dashboard ── */
function DashboardContent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();

  /* ── Thread state ── */
  const [threads, setThreads]       = useState<ThreadEntry[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const activeThread = threads.find(t => t.id === activeId) ?? null;

  /* ── Loading / input ── */
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing' | 'generating' | 'finalizing' | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState('');

  /* ── Composer file attachment (parsed client-side, embedded into the AI prompt) ── */
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [attaching, setAttaching]   = useState(false);

  const handleAttach = useCallback(async (file: File) => {
    setAttaching(true);
    try {
      const { attachment: parsed, error } = await readFileAttachment(file);
      if (error) toast.error(error);
      else setAttachment(parsed!);
    } finally {
      setAttaching(false);
    }
  }, []);

  const handleRemoveAttachment = useCallback(() => setAttachment(null), []);

  /* ── Forced chart type (gallery picker) — overrides the AI's own type judgment for the next request ── */
  const [chartType, setChartType] = useState<ChartSelection | null>(null);
  const handleClearChartType = useCallback(() => setChartType(null), []);

  /* ── Save / share ── */
  const [saving, setSaving]         = useState(false);

  /* ── Sidebar collapse ── */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── Edit panel ── */
  const [isEditing, setIsEditing]   = useState(false);
  const [manualEditJson, setManualEditJson] = useState('');

  /* ── Statistical analysis (independent of the active thread — runs on user-supplied data) ── */
  const [statsOpen, setStatsOpen]   = useState(false);

  /* ── URL / session load ── */
  const [seenId, setSeenId]         = useState<string | null>(null);

  React.useEffect(() => {
    const idFromUrl = searchParams.get('id');

    const loadById = async (id: string) => {
      if (seenId === id) return;
      setSeenId(id);
      setLoading(true); setLoadingStep('analyzing');
      try {
        const res = await getVisualizationById(id);
        if (res.success && res.data) {
          const viz = res.data as SavedVisualization;
          const entry: ThreadEntry = {
            id: genId(),
            prompt: viz.metadata?.originalInput || viz.title || '',
            spec: viz.spec,
            title: viz.title || 'Visualization',
            chatHistory: (viz.history || []) as ThreadEntry['chatHistory'],
            vizId: viz._id || null,
            isSaved: true,
            isPublic: viz.isPublic ?? false,
            shareId: viz.shareId ?? null,
            metadata: viz.metadata ? {
              generatedAt: typeof viz.metadata.generatedAt === 'string' ? viz.metadata.generatedAt : viz.metadata.generatedAt?.toString(),
              aiModel: viz.metadata.aiModel,
            } : undefined,
          };
          setThreads([entry]);
          setActiveId(entry.id);
          setManualEditJson(JSON.stringify(viz.spec.option, null, 2));
          toast.success(`Loaded "${viz.title}"`);
        } else toast.error(res.error || 'Failed to load');
      } catch { toast.error('Failed to load visualization'); }
      finally { setLoading(false); setLoadingStep(null); }
    };

    if (idFromUrl) { loadById(idFromUrl); return; }

    const rev = sessionStorage.getItem('revisualize_data');
    if (rev) {
      try {
        const parsed: SavedVisualization = JSON.parse(rev);
        const entry: ThreadEntry = {
          id: genId(),
          prompt: parsed.metadata?.originalInput || parsed.title || '',
          spec: parsed.spec,
          title: parsed.title || 'Visualization',
          chatHistory: (parsed.history || []) as ThreadEntry['chatHistory'],
          vizId: parsed._id || null,
          isSaved: false,
          isPublic: parsed.isPublic ?? false,
          shareId: parsed.shareId ?? null,
          metadata: parsed.metadata ? {
            generatedAt: typeof parsed.metadata.generatedAt === 'string' ? parsed.metadata.generatedAt : parsed.metadata.generatedAt?.toString(),
            aiModel: parsed.metadata.aiModel,
          } : undefined,
        };
        setThreads([entry]);
        setActiveId(entry.id);
        setManualEditJson(JSON.stringify(parsed.spec.option, null, 2));
        sessionStorage.removeItem('revisualize_data');
        toast.success(`Loaded "${parsed.title}"`);
      } catch { toast.error('Failed to load visualization data'); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Handlers ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachment && !chartType) || loading) return;

    const pendingAttachment = attachment;
    const pendingChartType = chartType;
    const displayPrompt = trimmed
      || (pendingChartType ? `${pendingChartType.type.label}${pendingChartType.variant ? ` — ${pendingChartType.variant.label}` : ''}` : `Visualize ${pendingAttachment!.name}`);
    const aiInput = composePromptWithChartType(composePromptWithAttachment(trimmed, pendingAttachment), pendingChartType);
    const pendingStyleEffect = getStyleEffect(pendingChartType);

    setInput('');
    setAttachment(null);
    setChartType(null);
    setLoading(true);
    setLoadingPrompt(displayPrompt);
    setLoadingStep('analyzing');

    try {
      const genTimer = setTimeout(() => setLoadingStep('generating'), 250);
      const data = await generateVisualization(aiInput, pendingStyleEffect);
      clearTimeout(genTimer);

      if (!data.success || !data.spec) {
        toast.error(data.error || 'Generation failed');
        setInput(trimmed);
        if (pendingAttachment) setAttachment(pendingAttachment);
        if (pendingChartType) setChartType(pendingChartType);
        return;
      }

      setLoadingStep('finalizing');
      await new Promise(r => setTimeout(r, 300));

      const entry: ThreadEntry = {
        id: genId(),
        prompt: displayPrompt,
        spec: data.spec,
        title: data.title || displayPrompt.slice(0, 60),
        chatHistory: [],
        vizId: null,
        isSaved: false,
        isPublic: false,
        shareId: null,
        metadata: data.metadata ? {
          generatedAt: data.metadata.generatedAt?.toString(),
          processingTime: data.metadata.processingTime,
          aiModel: data.metadata.aiModel,
          fromCache: data.fromCache,
        } : undefined,
      };
      setThreads(p => [...p, entry]);
      setActiveId(entry.id);
      setManualEditJson(JSON.stringify(data.spec.option, null, 2));
    } catch {
      toast.error('An unexpected error occurred.');
      setInput(trimmed);
      if (pendingAttachment) setAttachment(pendingAttachment);
      if (pendingChartType) setChartType(pendingChartType);
    } finally {
      setLoading(false);
      setLoadingStep(null);
      setLoadingPrompt('');
    }
  };

  const handleChatMessage = useCallback(async (message: string) => {
    if (!activeThread) return;
    const id = activeThread.id;
    setIsEditing(true);
    const newHist: ThreadEntry['chatHistory'] = [
      ...activeThread.chatHistory,
      { role: 'user', content: message, timestamp: new Date() },
    ];
    setThreads(p => p.map(t => t.id === id ? { ...t, chatHistory: newHist } : t));

    try {
      const res = await editVisualizationAction(
        message.trim(), activeThread.spec.option,
        activeThread.vizId || undefined,
        newHist,
      );
      if (!res.success) throw new Error(res.error || 'Edit failed');
      const finalHist: ThreadEntry['chatHistory'] = [
        ...newHist,
        { role: 'assistant', content: res.message || 'Done.', timestamp: new Date() },
      ];
      setThreads(p => p.map(t => t.id === id ? {
        ...t,
        spec: res.option ? { ...t.spec, option: res.option } : t.spec,
        chatHistory: finalHist,
      } : t));
      if (res.option) setManualEditJson(JSON.stringify(res.option, null, 2));
      toast.success(res.option ? 'Updated!' : 'Response received');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Edit failed';
      setThreads(p => p.map(t => t.id === id ? {
        ...t,
        chatHistory: [...newHist, { role: 'assistant', content: `Error: ${errMsg}`, timestamp: new Date() }],
      } : t));
      toast.error(errMsg);
    } finally {
      setIsEditing(false);
    }
  }, [activeThread]);

  const handleSave = useCallback(async () => {
    if (!activeThread || !isSignedIn) { toast.error('Please sign in to save'); return; }
    const id = activeThread.id;
    setSaving(true);
    try {
      const title = activeThread.title || 'Untitled';
      const metadata = {
        generatedAt: new Date(),
        aiModel: activeThread.metadata?.aiModel || 'gpt-5.4-mini',
        originalInput: activeThread.prompt,
        processingTime: activeThread.metadata?.processingTime,
      };
      const res = await saveVisualization(
        title, activeThread.spec, metadata,
        activeThread.isPublic ?? false, activeThread.vizId || undefined,
        activeThread.chatHistory as { role:'user'|'assistant'; content:string; timestamp:Date|string }[],
      );
      if (!res.success) { toast.error(res.error || 'Save failed'); return; }
      const newVizId = res.data?._id;
      const wasSaved = activeThread.isSaved;
      setThreads(p => p.map(t => t.id === id ? { ...t, vizId: newVizId || t.vizId, isSaved: true } : t));
      toast.success(wasSaved ? 'Updated!' : 'Saved!');
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  }, [activeThread, isSignedIn]);

  const handleShare = useCallback(async () => {
    if (!activeThread?.vizId) { toast.error('Save the visualization first to share publicly'); return; }
    const id = activeThread.id;
    try {
      if (activeThread.isPublic && activeThread.shareId) {
        const url = `${window.location.origin}/share/${activeThread.shareId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Public link copied!');
        return;
      }
      const res = await createShareLink(activeThread.vizId, { isPublic: true });
      if (!res.success || !res.data) { toast.error(res.error || 'Failed to create share link'); return; }
      setThreads(p => p.map(t => t.id === id ? { ...t, isPublic: true, shareId: res.data!.shareId } : t));
      await navigator.clipboard.writeText(res.data.shareUrl);
      toast.success('Public link created and copied!');
    } catch { toast.error('Failed to share'); }
  }, [activeThread]);

  const handleExportData = useCallback(async (format: 'json' | 'csv' | 'html') => {
    if (!activeThread?.vizId) { toast.error('Save the visualization first to export as ' + format.toUpperCase()); return; }
    try {
      const res = await exportVisualization(activeThread.vizId, format, { includeMetadata: true, title: activeThread.title });
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
  }, [activeThread]);

  const handleManualEdit = useCallback(async () => {
    if (!manualEditJson.trim() || !activeThread) { toast.error('Enter valid JSON'); return; }
    try {
      const parsedOption = JSON.parse(manualEditJson);
      const id = activeThread.id;
      const newSpec = { ...activeThread.spec, option: parsedOption };
      // Optimistic local update
      setThreads(p => p.map(t => t.id === id ? { ...t, spec: newSpec } : t));
      // Persist to DB if already saved
      if (activeThread.vizId) {
        const res = await saveVisualization(
          activeThread.title,
          newSpec,
          { generatedAt: new Date(), aiModel: activeThread.metadata?.aiModel || 'manual', originalInput: activeThread.prompt },
          activeThread.isPublic ?? false,
          activeThread.vizId,
          activeThread.chatHistory as { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[],
        );
        if (!res.success) { toast.error(res.error || 'Failed to save'); return; }
      }
      toast.success('Updated!');
    } catch (e) {
      if (e instanceof SyntaxError) toast.error('Invalid JSON');
      else toast.error('Update failed');
    }
  }, [manualEditJson, activeThread]);

  /* ── Brand theme customization — live restyle + debounced persistence ── */
  const themeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleThemeChange = useCallback((theme: BrandTheme) => {
    if (!activeThread) return;
    const id = activeThread.id;
    const newSpec = { ...activeThread.spec, theme };
    setThreads(p => p.map(t => t.id === id ? { ...t, spec: newSpec } : t));

    if (!activeThread.vizId) return;
    if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    themeSaveTimer.current = setTimeout(async () => {
      const res = await saveVisualization(
        activeThread.title,
        newSpec,
        { generatedAt: new Date(), aiModel: activeThread.metadata?.aiModel || 'manual', originalInput: activeThread.prompt },
        activeThread.isPublic ?? false,
        activeThread.vizId || undefined,
        activeThread.chatHistory as { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[],
      );
      if (!res.success) toast.error(res.error || 'Failed to save brand styling');
    }, 800);
  }, [activeThread]);

  const handleNew = useCallback(() => setActiveId(null), []);

  /* ── Loading overlay step text ── */
  const stepText =
    loadingStep === 'analyzing'  ? 'Analyzing your input…' :
    loadingStep === 'generating' ? 'Generating visualization…' :
    loadingStep === 'finalizing' ? 'Finalizing…' : 'Processing…';

  return (
    <div className="text-ink-muted flex flex-col h-screen w-full antialiased overflow-hidden bg-surface-0">
      <Header
        user={user || null}
        actions={
          <button
            onClick={() => setStatsOpen(true)}
            title="Run a statistical test (t-test, ANOVA, chi-square…) on your own data"
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <Sigma className="w-[15px] h-[15px]" />
            <span className="hidden sm:inline">Statistics</span>
          </button>
        }
      />
      <StatisticsModal open={statsOpen} onClose={() => setStatsOpen(false)} />

      <div className="flex-1 flex overflow-hidden min-h-0 pt-16 relative">
        {/* ── Left: Thread panel ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 overflow-hidden flex flex-col bg-surface-1 border-r border-edge"
            >
              <div className="w-[340px] h-full flex flex-col">
                <VizThread
                  threads={threads}
                  activeId={activeId}
                  onSelect={setActiveId}
                  onNew={handleNew}
                  loading={loading}
                  loadingPrompt={loadingPrompt}
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  attachment={attachment}
                  attaching={attaching}
                  onAttach={handleAttach}
                  onRemoveAttachment={handleRemoveAttachment}
                  chartType={chartType}
                  onChooseChartType={setChartType}
                  onClearChartType={handleClearChartType}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sidebar toggle ── */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          title={sidebarOpen ? 'Collapse panel' : 'Expand panel'}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-11 rounded-r-lg flex items-center justify-center bg-surface-2 border border-l-0 border-edge text-ink-faint hover:text-ink hover:bg-surface-3 transition-[left,colors] duration-200"
          style={{ left: sidebarOpen ? 340 : 0 }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* ── Right: Focus panel ── */}
        <div className="flex-1 relative overflow-hidden min-w-0">
          {/* Generation overlay */}
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium bg-surface-1 border border-accent/25 shadow-[0_8px_40px_rgba(0,0,0,0.5)] text-accent"
              >
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
                <span>{stepText}</span>
              </div>
            </div>
          )}

          <FocusPanel
            thread={activeThread}
            saving={saving}
            onSave={handleSave}
            onShare={handleShare}
            onExportData={handleExportData}
            chatHistory={activeThread?.chatHistory || []}
            handleChatMessage={handleChatMessage}
            isEditing={isEditing}
            manualEditJson={manualEditJson}
            setManualEditJson={setManualEditJson}
            handleManualEdit={handleManualEdit}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent />
    </Suspense>
  );
}
