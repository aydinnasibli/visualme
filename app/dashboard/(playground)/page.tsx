'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import type { FileAttachment } from '@/lib/utils/file-attachment';
import { readFileAttachment, buildSampleAttachment } from '@/lib/utils/file-attachment';
import { type ChartSelection } from '@/lib/utils/chart-types';
import type { LiveSheetData } from '@/lib/utils/live-sheet';
import type { StarterTemplate } from '@/lib/utils/starter-templates';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useThreadManager } from '@/lib/hooks/useThreadManager';
import { useVisualizationExport } from '@/lib/hooks/useVisualizationExport';
import type { StatRun } from '@/components/dashboard/VizThread';
import { toast } from 'sonner';

import Header from '@/components/dashboard/Header';
import VizThread from '@/components/dashboard/VizThread';
import FocusPanel from '@/components/dashboard/FocusPanel';
import WelcomeModal from '@/components/dashboard/WelcomeModal';

/* ── Helpers ── */
const Loading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
  </div>
);

/* ── Dashboard ── */
function DashboardContent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();

  /* ── Thread manager hook ── */
  const threadManager = useThreadManager({ searchParams, isSignedIn });
  const {
    threads, setThreads,
    activeId, setActiveId,
    activeThread,
    loading, loadingStep, loadingPrompt,
    handleNew, handleDeleteThread, handleTitleChange,
    handleChatMessage, handleSave, handleUndo,
    handleAnnotate, handleThemeChange,
    handleLiveDataChange, handleScheduleChange,
    handleRefreshLiveData, handleSubmit,
    handlePrepareStatTest,
    isEditing, saving, isRefreshing,
    activeLiveSheet, preparingStatTest,
  } = threadManager;

  /* ── Export hook ── */
  const { handleExportData, handleShare } = useVisualizationExport({
    activeThread,
    setThreads,
  });

  /* ── Composer file attachment (parsed client-side, embedded into the AI prompt) ── */
  const [input, setInput]           = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [attaching, setAttaching]   = useState(false);

  const handleAttach = useCallback(async (file: File) => {
    setAttaching(true);
    try {
      const { attachment: parsed, error } = await readFileAttachment(file);
      if (error) toast.error(error);
      else { setAttachment(parsed!); setStatRun(null); }
    } finally {
      setAttaching(false);
    }
  }, []);

  /* ── Statistical test run (independent of chart generation — scoped to whichever dataset is attached) ── */
  const [statRun, setStatRun] = useState<StatRun | null>(null);
  const handleRunStat = useCallback((run: StatRun) => setStatRun(run), [setStatRun]);
  const handleClearStat = useCallback(() => setStatRun(null), [setStatRun]);

  const handleRemoveAttachment = useCallback(() => {
    setAttachment(null);
    setStatRun(null);
  }, [setStatRun]);

  /* ── Forced chart type (gallery picker) — overrides the AI's own type judgment for the next request ── */
  const [chartType, setChartType] = useState<ChartSelection | null>(null);
  const handleClearChartType = useCallback(() => setChartType(null), []);

  /* ── Live Google Sheet / CSV connected via the composer ── */
  const [liveSheet, setLiveSheet] = useState<LiveSheetData | null>(null);
  const handleConnectLiveSheet = useCallback((data: LiveSheetData) => {
    setLiveSheet(data);
    setAttachment(null);
    setStatRun(null);
  }, [setStatRun]);
  const handleDisconnectLiveSheet = useCallback(() => {
    setLiveSheet(null);
    setStatRun(null);
  }, [setStatRun]);

  /* ── Starter template gallery — pre-fills prompt, sample data, and chart type for the empty composer ── */
  const handleUseTemplate = useCallback((template: StarterTemplate) => {
    setInput(template.prompt);
    setAttachment(buildSampleAttachment(template.sampleFilename, template.sampleData));
    setLiveSheet(null);
    setStatRun(null);
    setChartType(template.chartSelection);
  }, [setStatRun]);

  /* ── Submit wrapper: bridges composer state into the hook ── */
  const onSubmit = useCallback((e: React.SyntheticEvent) => {
    const composerState = { input, attachment, chartType, liveSheet };
    const clearComposer = () => {
      setInput('');
      setAttachment(null);
      setChartType(null);
      setLiveSheet(null);
    };
    const restoreComposer = () => {
      setInput(input.trim());
      if (attachment) setAttachment(attachment);
      if (chartType) setChartType(chartType);
      if (liveSheet) setLiveSheet(liveSheet);
    };
    handleSubmit(e, composerState, clearComposer, restoreComposer);
  }, [input, attachment, chartType, liveSheet, handleSubmit]);

  /* ── Dataset behind whichever attachment/live sheet is connected ── */
  const datasetColumns = activeThread?.datasetColumns ?? attachment?.datasetColumns ?? liveSheet?.datasetColumns ?? activeLiveSheet?.datasetColumns;
  const datasetRowCount = activeThread?.datasetRowCount ?? attachment?.rowCount ?? liveSheet?.rowCount ?? activeLiveSheet?.rowCount ?? datasetColumns?.[0]?.values.length ?? 0;

  /* ── Sidebar collapse ── */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── Responsive: below `lg`, the session panel becomes an overlay drawer ── */
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // On mobile, auto-show the session panel when there's nothing active (so the
  // composer is reachable) and auto-hide it once a visualization is selected.
  const [prevMobileNav, setPrevMobileNav] = useState({ activeId, isMobile });
  if (activeId !== prevMobileNav.activeId || isMobile !== prevMobileNav.isMobile) {
    setPrevMobileNav({ activeId, isMobile });
    if (isMobile) setSidebarOpen(activeId === null);
  }

  /* ── Loading overlay step text ── */
  const stepText =
    loadingStep === 'analyzing'  ? 'Analyzing your input…' :
    loadingStep === 'generating' ? 'Generating visualization…' :
    loadingStep === 'finalizing' ? 'Finalizing…' : 'Processing…';

  return (
    <div className="text-ink-muted flex flex-col h-screen w-full antialiased overflow-hidden bg-surface-0">
      <Header />

      <div className="flex-1 flex overflow-hidden min-h-0 pt-16 relative">
        {/* ── Mobile backdrop for the session drawer ── */}
        {isMobile && sidebarOpen && (
          <div
            className="lg:hidden fixed top-16 inset-x-0 bottom-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Left: Thread panel ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 340, opacity: 1 }}
              exit={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={
                isMobile
                  ? 'fixed top-16 bottom-0 left-0 z-40 w-[85vw] max-w-[340px] flex flex-col bg-surface-1 border-r border-edge'
                  : 'shrink-0 overflow-hidden flex flex-col bg-surface-1 border-r border-edge'
              }
            >
              <div className="w-full lg:w-[340px] h-full flex flex-col">
                <VizThread
                  threads={threads}
                  activeId={activeId}
                  onSelect={setActiveId}
                  onNew={handleNew}
                  loading={loading}
                  loadingPrompt={loadingPrompt}
                  input={input}
                  setInput={setInput}
                  onSubmit={onSubmit}
                  attachment={attachment}
                  attaching={attaching}
                  onAttach={handleAttach}
                  onRemoveAttachment={handleRemoveAttachment}
                  chartType={chartType}
                  onChooseChartType={setChartType}
                  onClearChartType={handleClearChartType}
                  statRun={statRun}
                  onRunStat={handleRunStat}
                  onClearStat={handleClearStat}
                  liveSheet={liveSheet}
                  onConnectLiveSheet={handleConnectLiveSheet}
                  onDisconnectLiveSheet={handleDisconnectLiveSheet}
                  onDelete={handleDeleteThread}
                  onUseTemplate={handleUseTemplate}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sidebar toggle ── */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label={sidebarOpen ? 'Collapse panel' : 'Expand panel'}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-11 rounded-r-lg flex items-center justify-center bg-surface-2 border border-l-0 border-edge text-ink-faint hover:text-ink hover:bg-surface-3 transition-[left,color,background-color,border-color] duration-200"
          style={{ left: sidebarOpen ? (isMobile ? 'min(340px, 85vw)' : 340) : 0 }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        <WelcomeModal />

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
            onThemeChange={handleThemeChange}
            onTitleChange={handleTitleChange}
            onLiveDataChange={handleLiveDataChange}
            onRefreshLiveData={handleRefreshLiveData}
            isRefreshing={isRefreshing}
            onScheduleChange={handleScheduleChange}
            statRun={statRun}
            datasetColumns={datasetColumns}
            datasetRowCount={datasetRowCount}
            onRunStat={handleRunStat}
            onPrepareStatTest={handlePrepareStatTest}
            preparingStatTest={preparingStatTest}
            onUndo={handleUndo}
            canUndo={Boolean(activeThread?.specHistory?.length)}
            onAnnotate={handleAnnotate}
            onSuggestPrompt={setInput}
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
