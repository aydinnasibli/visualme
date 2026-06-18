'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import {
  generateVisualization, saveVisualization, editVisualizationAction,
  getVisualizationById, saveLiveDataConfig, createSession, getUserSessions,
  updateVisualizationTitle, deleteVisualization, updateVisualizationSchedule,
} from '@/lib/actions/visualize';
import { exportVisualization, createShareLink } from '@/lib/actions/export';
import type { SavedVisualization } from '@/lib/types/visualization';
import type { BrandTheme } from '@/lib/types/echarts-spec';
import { DEFAULT_SUNSET_THEME } from '@/lib/types/echarts-spec';
import { readFileAttachment, composePromptWithAttachment, buildSampleAttachment, type FileAttachment } from '@/lib/utils/file-attachment';
import { composePromptWithChartType, getStyleEffect, type ChartSelection } from '@/lib/utils/chart-types';
import { composePromptWithLiveSheet, formatLiveDataBlock, detectLiveSheetColumns, type LiveSheetData } from '@/lib/utils/live-sheet';
import type { StarterTemplate } from '@/lib/utils/starter-templates';
import type { ColumnSchema } from '@/lib/utils/csv-schema';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { toast } from 'sonner';

import Header from '@/components/dashboard/Header';
import VizThread, { type ThreadEntry, type StatRun } from '@/components/dashboard/VizThread';
import FocusPanel from '@/components/dashboard/FocusPanel';
import WelcomeModal from '@/components/dashboard/WelcomeModal';

/* ── Helpers ── */
interface LiveDataResponse {
  rawCsv?: string;
  headers?: string[];
  rowCount?: number;
  schema?: ColumnSchema[];
  error?: string;
}

const Loading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-surface-3 border-t-accent rounded-full animate-spin" />
  </div>
);

function genId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

function createDemoThread(): ThreadEntry {
  return {
    id: genId(),
    isDemoThread: true,
    prompt: 'Website traffic by acquisition channel over 6 months',
    title: 'Website Traffic by Channel',
    chatHistory: [],
    vizId: null,
    isSaved: false,
    isPublic: false,
    shareId: null,
    spec: {
      option: {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } } },
        legend: { data: ['Organic', 'Paid', 'Referral'] },
        xAxis: [{ type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }],
        yAxis: [{ type: 'value', name: 'Visitors' }],
        series: [
          { name: 'Organic', type: 'line', stack: 'Total', smooth: true, areaStyle: {}, emphasis: { focus: 'series' }, data: [8200, 8600, 9100, 9800, 10400, 11200] },
          { name: 'Paid',    type: 'line', stack: 'Total', smooth: true, areaStyle: {}, emphasis: { focus: 'series' }, data: [3100, 3400, 3900, 4300, 4800, 5600] },
          { name: 'Referral',type: 'line', stack: 'Total', smooth: true, areaStyle: {}, emphasis: { focus: 'series' }, data: [1400, 1500, 1700, 1900, 2100, 2400] },
        ],
      },
      theme: DEFAULT_SUNSET_THEME,
      title: 'Website Traffic by Channel',
      narrative: "Organic search is your fastest-growing channel — up 37% over 6 months — and now drives 58% of total traffic. Paid is scaling efficiently alongside it. At this trajectory you'll cross 20K monthly visitors by September without increasing ad spend.",
    },
  };
}

/* Consume a "re-visualize" handoff left in sessionStorage by another page. */
function readRevisualizeHandoff(): { entry: ThreadEntry; title: string } | null {
  if (typeof window === 'undefined') return null;
  const rev = sessionStorage.getItem('revisualize_data');
  if (!rev) return null;
  try {
    const parsed: SavedVisualization = JSON.parse(rev);
    const entry: ThreadEntry = {
      id: genId(),
      prompt: parsed.metadata?.originalInput || parsed.title || '',
      spec: parsed.spec,
      title: parsed.title || 'Visualization',
      chatHistory: (parsed.history || []) as ThreadEntry['chatHistory'],
      vizId: parsed._id || null,
      isSaved: parsed.isSaved ?? true,
      isPublic: parsed.isPublic ?? false,
      shareId: parsed.shareId ?? null,
      metadata: parsed.metadata ? {
        generatedAt: typeof parsed.metadata.generatedAt === 'string' ? parsed.metadata.generatedAt : parsed.metadata.generatedAt?.toString(),
        aiModel: parsed.metadata.aiModel,
      } : undefined,
      liveData: parsed.liveData,
      schedule: parsed.schedule,
    };
    return { entry, title: parsed.title || 'Visualization' };
  } catch {
    return null;
  }
}

/* ── Dashboard ── */
function DashboardContent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();

  /* ── "Re-visualize" handoff from another page (sessionStorage), consumed once on mount ── */
  const [revHandoff] = useState(() => searchParams.get('id') ? null : readRevisualizeHandoff());

  /* ── Thread state ── */
  const [threads, setThreads]       = useState<ThreadEntry[]>(() => revHandoff ? [revHandoff.entry] : []);
  const [activeId, setActiveId]     = useState<string | null>(() => revHandoff?.entry.id ?? null);
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

  /* ── Live sheet data for the *currently loaded* thread's persisted liveData —
   * lazily fetched when the Test button is pressed, so a revisualized/reloaded
   * live chart can run stat tests without an eager (rate-limited) fetch on
   * every thread switch. ── */
  const [activeLiveSheet, setActiveLiveSheet] = useState<LiveSheetData | null>(null);
  const [preparingStatTest, setPreparingStatTest] = useState(false);

  // Reset during render (not an effect) when the active thread changes — avoids
  // a cascading extra render from setState-in-effect for what's purely a
  // derived "stale data belongs to a different thread" reset.
  const [prevActiveIdForLiveSheet, setPrevActiveIdForLiveSheet] = useState(activeId);
  if (activeId !== prevActiveIdForLiveSheet) {
    setPrevActiveIdForLiveSheet(activeId);
    setActiveLiveSheet(null);
  }

  const handlePrepareStatTest = useCallback(async () => {
    const url = activeThread?.liveData?.url;
    if (!url || activeLiveSheet?.url === url) return;
    setPreparingStatTest(true);
    try {
      const res = await fetch(`/api/live-data?url=${encodeURIComponent(url)}`);
      const data: LiveDataResponse = await res.json();
      if (!res.ok || data.error || !data.rawCsv) {
        toast.error(data.error || `Failed to fetch live data (HTTP ${res.status})`);
        return;
      }
      setActiveLiveSheet({
        url,
        rawCsv: data.rawCsv,
        headers: data.headers ?? [],
        rowCount: data.rowCount ?? 0,
        schema: data.schema ?? [],
        datasetColumns: detectLiveSheetColumns(data.rawCsv),
      });
    } catch {
      toast.error('Failed to load dataset for testing');
    } finally {
      setPreparingStatTest(false);
    }
  }, [activeThread, activeLiveSheet]);

  /* ── Dataset behind whichever attachment/live sheet is connected — lets the Focus panel run stat tests too.
   * The active thread's own dataset (captured at generation time) takes priority, so the Test button stays
   * available for that chart for the rest of the session, even after the composer attachment is cleared. ── */
  const datasetColumns = activeThread?.datasetColumns ?? attachment?.datasetColumns ?? liveSheet?.datasetColumns ?? activeLiveSheet?.datasetColumns;
  const datasetRowCount = activeThread?.datasetRowCount ?? attachment?.rowCount ?? liveSheet?.rowCount ?? activeLiveSheet?.rowCount ?? datasetColumns?.[0]?.values.length ?? 0;

  /* ── Save / share ── */
  const [saving, setSaving]         = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  /* ── Edit panel ── */
  const [isEditing, setIsEditing]   = useState(false);

  /* ── URL / session load ── */
  const [seenId, setSeenId]         = useState<string | null>(null);
  const sessionsLoadedRef = useRef(false);

  // Notify + clean up sessionStorage for the "re-visualize" handoff consumed above.
  useEffect(() => {
    if (!revHandoff) return;
    sessionStorage.removeItem('revisualize_data');
    toast.success(`Loaded "${revHandoff.title}"`);
  }, [revHandoff]);

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
            liveData: viz.liveData,
            schedule: viz.schedule,
          };
          setThreads([entry]);
          setActiveId(entry.id);
          toast.success(`Loaded "${viz.title}"`);
        } else toast.error(res.error || 'Failed to load');
      } catch { toast.error('Failed to load visualization'); }
      finally { setLoading(false); setLoadingStep(null); }
    };

    if (idFromUrl) { loadById(idFromUrl); return; }

    // Already hydrated from a "re-visualize" handoff on first render.
    if (revHandoff) return;

    // No deep link / handoff — hydrate the sidebar with the user's persisted sessions
    if (sessionsLoadedRef.current || isSignedIn !== true) return;
    sessionsLoadedRef.current = true;

    const loadSessions = async () => {
      try {
        const res = await getUserSessions();
        if (res.success && res.data) {
          const entries: ThreadEntry[] = (res.data as SavedVisualization[]).map(viz => ({
            id: genId(),
            prompt: viz.metadata?.originalInput || viz.title || '',
            spec: viz.spec,
            title: viz.title || 'Visualization',
            chatHistory: (viz.history || []) as ThreadEntry['chatHistory'],
            vizId: viz._id || null,
            isSaved: viz.isSaved ?? true,
            isPublic: viz.isPublic ?? false,
            shareId: viz.shareId ?? null,
            metadata: viz.metadata ? {
              generatedAt: typeof viz.metadata.generatedAt === 'string' ? viz.metadata.generatedAt : viz.metadata.generatedAt?.toString(),
              aiModel: viz.metadata.aiModel,
            } : undefined,
            liveData: viz.liveData,
            schedule: viz.schedule,
          }));
          if (entries.length === 0) {
            const demo = createDemoThread();
            setThreads([demo]);
            setActiveId(demo.id);
          } else {
            setThreads(entries);
          }
        }
      } catch { /* sidebar hydration is best-effort */ }
    };
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isSignedIn, revHandoff]);

  /* ── Handlers ── */
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachment && !chartType && !liveSheet) || loading) return;

    const pendingAttachment = attachment;
    const pendingChartType = chartType;
    const pendingLiveSheet = liveSheet;
    const displayPrompt = trimmed
      || (pendingChartType ? `${pendingChartType.type.label}${pendingChartType.variant ? ` — ${pendingChartType.variant.label}` : ''}`
        : pendingAttachment ? `Visualize ${pendingAttachment.name}`
        : 'Visualize connected Google Sheet');
    const aiInput = composePromptWithChartType(
      composePromptWithLiveSheet(composePromptWithAttachment(trimmed, pendingAttachment), pendingLiveSheet),
      pendingChartType,
    );
    const pendingStyleEffect = getStyleEffect(pendingChartType);

    setInput('');
    setAttachment(null);
    setChartType(null);
    setLiveSheet(null);
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
        if (pendingLiveSheet) setLiveSheet(pendingLiveSheet);
        return;
      }

      setLoadingStep('finalizing');
      await new Promise(r => setTimeout(r, 300));

      const liveDataForEntry = pendingLiveSheet
        ? { url: pendingLiveSheet.url, interval: 0, lastRefreshed: new Date().toISOString() }
        : undefined;

      const entry: ThreadEntry = {
        id: genId(),
        prompt: displayPrompt,
        spec: data.spec,
        title: data.title || displayPrompt.slice(0, 60),
        chatHistory: [],
        vizId: null,
        isSaved: !!liveDataForEntry,
        isPublic: false,
        shareId: null,
        metadata: data.metadata ? {
          generatedAt: data.metadata.generatedAt?.toString(),
          processingTime: data.metadata.processingTime,
          aiModel: data.metadata.aiModel,
          fromCache: data.fromCache,
        } : undefined,
        liveData: liveDataForEntry,
        datasetColumns: pendingAttachment?.datasetColumns ?? pendingLiveSheet?.datasetColumns,
        datasetRowCount: pendingAttachment?.rowCount ?? pendingLiveSheet?.rowCount,
      };
      setThreads(p => [...p.filter(t => !t.isDemoThread), entry]);
      setActiveId(entry.id);

      // Auto-persist as a session — patch vizId once the doc is created
      createSession(
        entry.title,
        entry.spec,
        data.metadata ?? { generatedAt: new Date(), originalInput: aiInput },
        [],
        liveDataForEntry ?? null,
      ).then(res => {
        if (res.success && res.id) {
          setThreads(p => p.map(t => t.id === entry.id ? { ...t, vizId: res.id! } : t));
        } else if (!res.success) {
          console.error('Failed to persist session:', res.error);
        }
      });
    } catch {
      toast.error('An unexpected error occurred.');
      setInput(trimmed);
      if (pendingAttachment) setAttachment(pendingAttachment);
      if (pendingChartType) setChartType(pendingChartType);
      if (pendingLiveSheet) setLiveSheet(pendingLiveSheet);
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
      const prevSpec = activeThread.spec;
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
        spec: res.option ? { ...t.spec, option: res.option, narrative: res.narrative ?? t.spec.narrative } : t.spec,
        chatHistory: finalHist,
        // Push spec snapshot for undo only when the chart actually changed
        specHistory: res.option
          ? [...(t.specHistory ?? []).slice(-9), prevSpec]
          : t.specHistory,
        // Once the user edits the demo chart, it's theirs — drop the badge
        isDemoThread: res.option ? false : t.isDemoThread,
      } : t));
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
    if (!activeThread) return;
    if (isSignedIn === false) { toast.error('Please sign in to save'); return; }
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  }, [activeThread]);

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

  const handleUndo = useCallback(() => {
    if (!activeThread?.specHistory?.length) return;
    const id = activeThread.id;
    const prevHistory = activeThread.specHistory.slice(0, -1);
    const prevSpec = activeThread.specHistory[activeThread.specHistory.length - 1];
    setThreads(p => p.map(t => t.id === id ? {
      ...t,
      spec: prevSpec,
      specHistory: prevHistory,
      chatHistory: t.chatHistory.slice(0, -2),
    } : t));
    toast.success('Undone');
  }, [activeThread]);

  const handleAnnotate = useCallback((annotations: import('@/lib/types/echarts-spec').Annotation[]) => {
    if (!activeThread) return;
    const id = activeThread.id;
    const newSpec = { ...activeThread.spec, annotations };
    setThreads(p => p.map(t => t.id === id ? { ...t, spec: newSpec } : t));
  }, [activeThread]);

  const handleTitleChange = useCallback((title: string) => {
    if (!activeThread) return;
    const id = activeThread.id;
    setThreads(p => p.map(t => t.id === id ? { ...t, title } : t));

    if (activeThread.vizId) {
      updateVisualizationTitle(activeThread.vizId, title).then(res => {
        if (!res.success) toast.error(res.error || 'Failed to rename');
      });
    }
  }, [activeThread]);

  const handleDeleteThread = useCallback((id: string) => {
    const thread = threads.find(t => t.id === id);
    if (!thread) return;

    toast('Delete this session?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          setThreads(p => p.filter(t => t.id !== id));
          setActiveId(prev => prev === id ? null : prev);
          if (thread.vizId) {
            const res = await deleteVisualization(thread.vizId);
            if (!res.success) toast.error(res.error || 'Failed to delete');
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  }, [threads]);

  /* ── Live data config ── */
  const handleLiveDataChange = useCallback(async (config: { url: string; interval: number } | null) => {
    if (!activeThread) return;
    const id = activeThread.id;

    // Optimistic update
    setThreads(p => p.map(t => t.id === id
      ? {
          ...t,
          liveData: config ? { ...config, lastRefreshed: t.liveData?.lastRefreshed } : undefined,
          isSaved: config ? true : t.isSaved,
        }
      : t
    ));

    // Persist if already saved
    if (activeThread.vizId) {
      const res = await saveLiveDataConfig(activeThread.vizId, config);
      if (!res.success) toast.error(res.error || 'Failed to save live data config');
      else toast.success(config ? 'Live data connected!' : 'Live data disconnected');
    } else {
      toast.success(config ? 'Live data connected! Save the visualization to persist it.' : 'Live data disconnected');
    }
  }, [activeThread]);

  /* ── Email digest schedule ── */
  const handleScheduleChange = useCallback(async (schedule: { enabled: boolean; dayOfWeek: number }) => {
    if (!activeThread?.vizId) return;
    const id = activeThread.id;

    // Optimistic update
    setThreads(p => p.map(t => t.id === id
      ? { ...t, schedule: { ...schedule, lastSentAt: t.schedule?.lastSentAt } }
      : t
    ));

    const res = await updateVisualizationSchedule(activeThread.vizId, schedule);
    if (!res.success) toast.error(res.error || 'Failed to update email digest');
    else toast.success(schedule.enabled ? 'Email digest enabled' : 'Email digest disabled');
  }, [activeThread]);

  const handleRefreshLiveData = useCallback(async () => {
    if (!activeThread?.liveData?.url || isRefreshing) return;
    const id = activeThread.id;
    setIsRefreshing(true);

    try {
      const res = await fetch(`/api/live-data?url=${encodeURIComponent(activeThread.liveData.url)}`);
      const data: LiveDataResponse = await res.json();

      if (!res.ok || data.error || !data.rawCsv) {
        toast.error(data.error || `Failed to fetch live data (HTTP ${res.status})`);
        return;
      }

      const editPrompt =
        `Update this chart with the latest data from the live source.\n\n` +
        `${formatLiveDataBlock({ rawCsv: data.rawCsv, headers: data.headers ?? [], rowCount: data.rowCount ?? 0, schema: data.schema ?? [] })}\n\n` +
        `Keep the same chart type, structure, axis labels, and series names. Only replace the data values.`;

      const editRes = await editVisualizationAction(editPrompt, activeThread.spec.option, activeThread.vizId || undefined, []);
      if (!editRes.success || !editRes.option) {
        toast.error(editRes.error || 'Data refresh failed');
        return;
      }

      const now = new Date().toISOString();
      setThreads(p => p.map(t => t.id === id ? {
        ...t,
        spec: { ...t.spec, option: editRes.option! },
        liveData: t.liveData ? { ...t.liveData, lastRefreshed: now } : undefined,
      } : t));

      // Persist lastRefreshed to DB
      if (activeThread.vizId && activeThread.liveData) {
        await saveLiveDataConfig(activeThread.vizId, {
          url: activeThread.liveData.url,
          interval: activeThread.liveData.interval,
          lastRefreshed: now,
        });
      }

      toast.success(`Chart refreshed — ${data.rowCount ?? '?'} rows`);
    } catch {
      toast.error('Live data refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeThread, isRefreshing]);

  /* ── Auto-refresh on interval ──
   * Use a ref to always call the latest handleRefreshLiveData without
   * restarting the interval on every render (React docs "latest ref" pattern).
   */
  const refreshCallbackRef = useRef(handleRefreshLiveData);
  useEffect(() => { refreshCallbackRef.current = handleRefreshLiveData; });

  useEffect(() => {
    const url = activeThread?.liveData?.url;
    const interval = activeThread?.liveData?.interval;
    if (!url || !interval) return;
    const ms = interval * 60 * 1000;
    const timer = setInterval(() => { refreshCallbackRef.current(); }, ms);
    return () => clearInterval(timer);
  // threadId ensures we restart the interval when the user switches threads,
  // even if the new thread has the same URL/interval values.
  }, [activeThread?.liveData?.url, activeThread?.liveData?.interval, activeThread?.id]);

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
                  onSubmit={handleSubmit}
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
          title={sidebarOpen ? 'Collapse panel' : 'Expand panel'}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-11 rounded-r-lg flex items-center justify-center bg-surface-2 border border-l-0 border-edge text-ink-faint hover:text-ink hover:bg-surface-3 transition-[left,colors] duration-200"
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
