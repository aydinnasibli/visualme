import { useState, useCallback, useRef, useEffect } from 'react';
import type { SavedVisualization } from '@/lib/types/visualization';
import type { BrandTheme, Annotation } from '@/lib/types/echarts-spec';
import { DEFAULT_SUNSET_THEME } from '@/lib/types/echarts-spec';
import type { ThreadEntry } from '@/components/dashboard/VizThread';
import {
  generateVisualization, saveVisualization, editVisualizationAction,
  getVisualizationById, saveLiveDataConfig, createSession, getUserSessions,
  updateVisualizationTitle, deleteVisualization, updateVisualizationSchedule,
} from '@/lib/actions/visualize';
import { formatLiveDataBlock, detectLiveSheetColumns, type LiveSheetData } from '@/lib/utils/live-sheet';
import { composePromptWithAttachment, type FileAttachment } from '@/lib/utils/file-attachment';
import { composePromptWithChartType, getStyleEffect, type ChartSelection } from '@/lib/utils/chart-types';
import { composePromptWithLiveSheet } from '@/lib/utils/live-sheet';
import type { ColumnSchema } from '@/lib/utils/csv-schema';
import { toast } from 'sonner';

/* ── Helpers ── */
interface LiveDataResponse {
  rawCsv?: string;
  headers?: string[];
  rowCount?: number;
  schema?: ColumnSchema[];
  error?: string;
}

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

export { genId, createDemoThread, readRevisualizeHandoff };

/* ── Hook ── */
export interface UseThreadManagerOptions {
  searchParams: ReturnType<typeof import('next/navigation').useSearchParams>;
  isSignedIn: boolean | undefined;
}

export function useThreadManager({ searchParams, isSignedIn }: UseThreadManagerOptions) {
  /* ── "Re-visualize" handoff from another page (sessionStorage), consumed once on mount ── */
  const [revHandoff] = useState(() => searchParams.get('id') ? null : readRevisualizeHandoff());

  /* ── Thread state ── */
  const [threads, setThreads]       = useState<ThreadEntry[]>(() => revHandoff ? [revHandoff.entry] : []);
  const [activeId, setActiveId]     = useState<string | null>(() => revHandoff?.entry.id ?? null);
  const activeThread = threads.find(t => t.id === activeId) ?? null;

  /* ── URL / session load ── */
  const [seenId, setSeenId]         = useState<string | null>(null);
  const sessionsLoadedRef = useRef(false);

  /* ── Loading state for session hydration ── */
  const [hydrationLoading, setHydrationLoading] = useState(false);
  const [hydrationStep, setHydrationStep] = useState<'analyzing' | null>(null);

  // Notify + clean up sessionStorage for the "re-visualize" handoff consumed above.
  useEffect(() => {
    if (!revHandoff) return;
    sessionStorage.removeItem('revisualize_data');
    toast.success(`Loaded "${revHandoff.title}"`);
  }, [revHandoff]);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');

    const loadById = async (id: string) => {
      if (seenId === id) return;
      setSeenId(id);
      setHydrationLoading(true); setHydrationStep('analyzing');
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
      finally { setHydrationLoading(false); setHydrationStep(null); }
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

  /* ── Thread CRUD handlers ── */
  const handleNew = useCallback(() => setActiveId(null), []);

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

  const handleTitleChange = useCallback((title: string) => {
    if (!activeThread) return;
    const id = activeThread.id;
    setThreads(p => p.map(t => t.id === id ? { ...t, title } : t));

    if (activeThread.vizId) {
      updateVisualizationTitle(activeThread.vizId, title).then(res => {
        if (!res.success) toast.error(res.error || 'Failed to rename');
      }).catch(() => { toast.error('Failed to rename'); });
    }
  }, [activeThread]);

  /* ── Chat editing ── */
  const [isEditing, setIsEditing] = useState(false);

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
        specHistory: res.option
          ? [...(t.specHistory ?? []).slice(-9), prevSpec]
          : t.specHistory,
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

  /* ── Save ── */
  const [saving, setSaving] = useState(false);

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

  /* ── Undo ── */
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

  /* ── Annotations ── */
  const handleAnnotate = useCallback((annotations: Annotation[]) => {
    if (!activeThread) return;
    const id = activeThread.id;
    const newSpec = { ...activeThread.spec, annotations };
    setThreads(p => p.map(t => t.id === id ? { ...t, spec: newSpec } : t));
  }, [activeThread]);

  /* ── Brand theme customization — live restyle + debounced persistence ── */
  const themeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    };
  }, []);
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

  /* ── Live data refresh ── */
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  /* ── Auto-refresh on interval ── */
  const refreshCallbackRef = useRef(handleRefreshLiveData);
  useEffect(() => { refreshCallbackRef.current = handleRefreshLiveData; });

  useEffect(() => {
    const url = activeThread?.liveData?.url;
    const interval = activeThread?.liveData?.interval;
    if (!url || !interval) return;
    const ms = interval * 60 * 1000;
    const timer = setInterval(() => { refreshCallbackRef.current(); }, ms);
    return () => clearInterval(timer);
  }, [activeThread?.liveData?.url, activeThread?.liveData?.interval, activeThread?.id]);

  /* ── Generation (handleSubmit) ── */
  const [loading, setLoading]       = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing' | 'generating' | 'finalizing' | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState('');

  const handleSubmit = useCallback(async (
    e: React.SyntheticEvent,
    composerState: {
      input: string;
      attachment: FileAttachment | null;
      chartType: ChartSelection | null;
      liveSheet: LiveSheetData | null;
    },
    clearComposer: () => void,
    restoreComposer: () => void,
  ) => {
    const { input, attachment: pendingAttachment, chartType: pendingChartType, liveSheet: pendingLiveSheet } = composerState;
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !pendingAttachment && !pendingChartType && !pendingLiveSheet) || loading) return;

    const displayPrompt = trimmed
      || (pendingChartType ? `${pendingChartType.type.label}${pendingChartType.variant ? ` — ${pendingChartType.variant.label}` : ''}`
        : pendingAttachment ? `Visualize ${pendingAttachment.name}`
        : 'Visualize connected Google Sheet');
    const aiInput = composePromptWithChartType(
      composePromptWithLiveSheet(composePromptWithAttachment(trimmed, pendingAttachment), pendingLiveSheet),
      pendingChartType,
    );
    const pendingStyleEffect = getStyleEffect(pendingChartType);

    clearComposer();
    setLoading(true);
    setLoadingPrompt(displayPrompt);
    setLoadingStep('analyzing');

    try {
      const genTimer = setTimeout(() => setLoadingStep('generating'), 250);
      const data = await generateVisualization(aiInput, pendingStyleEffect);
      clearTimeout(genTimer);

      if (!data.success || !data.spec) {
        toast.error(data.error || 'Generation failed');
        restoreComposer();
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
      }).catch(err => {
        console.error('Session creation failed:', err);
      });
    } catch {
      toast.error('An unexpected error occurred.');
      restoreComposer();
    } finally {
      setLoading(false);
      setLoadingStep(null);
      setLoadingPrompt('');
    }
  }, [loading]);

  /* ── Live sheet data for the *currently loaded* thread's persisted liveData ── */
  const [activeLiveSheet, setActiveLiveSheet] = useState<LiveSheetData | null>(null);
  const [preparingStatTest, setPreparingStatTest] = useState(false);

  // Reset during render when the active thread changes
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

  return {
    // Thread state
    threads,
    setThreads,
    activeId,
    setActiveId,
    activeThread,
    revHandoff,

    // Loading
    loading: loading || hydrationLoading,
    loadingStep: loadingStep || hydrationStep,
    loadingPrompt,

    // Handlers
    handleNew,
    handleDeleteThread,
    handleTitleChange,
    handleChatMessage,
    handleSave,
    handleUndo,
    handleAnnotate,
    handleThemeChange,
    handleLiveDataChange,
    handleScheduleChange,
    handleRefreshLiveData,
    handleSubmit,
    handlePrepareStatTest,

    // Chat edit state
    isEditing,
    saving,
    isRefreshing,

    // Stat test live sheet
    activeLiveSheet,
    preparingStatTest,
  };
}
