'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import {
  generateVisualization, saveVisualization, expandNodeAction,
  expandMindMapNodeAction, getVisualizationById, editVisualizationAction,
} from '@/lib/actions/visualize';
import type {
  VisualizationResponse, NetworkGraphData, MindMapData,
  VisualizationType, MindMapNode, SavedVisualization,
} from '@/lib/types/visualization';
import { toast } from 'sonner';

import Header from '@/components/dashboard/Header';
import VizThread, { type ThreadEntry } from '@/components/dashboard/VizThread';
import FocusPanel from '@/components/dashboard/FocusPanel';

/* ── Helpers ── */
const Loading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
  </div>
);

const updateMindMapNode = (root: MindMapNode, nodeId: string, newChildren: MindMapNode[]): MindMapNode => {
  if (root.id === nodeId) return { ...root, children: [...(root.children || []), ...newChildren] };
  if (root.children) return { ...root, children: root.children.map(c => updateMindMapNode(c, nodeId, newChildren)) };
  return root;
};

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
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  /* ── Save / share ── */
  const [saving, setSaving]         = useState(false);
  const [isPublic, setIsPublic]     = useState(false);

  /* ── Edit panel ── */
  const [isEditing, setIsEditing]   = useState(false);
  const [manualEditJson, setManualEditJson] = useState('');

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
            type: viz.type,
            data: viz.data,
            title: viz.title || 'Visualization',
            chatHistory: (viz.history || []) as ThreadEntry['chatHistory'],
            vizId: viz._id || null,
            isSaved: true,
          };
          setThreads([entry]);
          setActiveId(entry.id);
          setManualEditJson(JSON.stringify(viz.data, null, 2));
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
          type: parsed.type,
          data: parsed.data,
          title: parsed.title || 'Visualization',
          chatHistory: (parsed.history || []) as ThreadEntry['chatHistory'],
          vizId: parsed._id || null,
          isSaved: false,
        };
        setThreads([entry]);
        setActiveId(entry.id);
        setManualEditJson(JSON.stringify(parsed.data, null, 2));
        sessionStorage.removeItem('revisualize_data');
        toast.success(`Loaded "${parsed.title}"`);
      } catch { toast.error('Failed to load visualization data'); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Handlers ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const prompt = input.trim();
    setInput('');
    setLoading(true);
    setLoadingPrompt(prompt);
    setLoadingStep('analyzing');

    try {
      const genTimer = setTimeout(() => setLoadingStep('generating'), 250);
      const data = await generateVisualization(
        prompt,
        (!autoSelect && selectedType) ? (selectedType as VisualizationType) : undefined
      );
      clearTimeout(genTimer);

      if (!data.success) {
        toast.error(data.error || 'Generation failed');
        setInput(prompt);
        return;
      }

      setLoadingStep('finalizing');
      await new Promise(r => setTimeout(r, 300));

      const entry: ThreadEntry = {
        id: genId(),
        prompt,
        type: data.type,
        data: data.data,
        title: data.title || prompt.slice(0, 60),
        chatHistory: [],
        vizId: null,
        isSaved: false,
      };
      setThreads(p => [...p, entry]);
      setActiveId(entry.id);
      setManualEditJson(JSON.stringify(data.data, null, 2));
    } catch {
      toast.error('An unexpected error occurred.');
      setInput(prompt);
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
        message.trim(), activeThread.data, activeThread.type,
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
        data: res.data ?? t.data,
        chatHistory: finalHist,
      } : t));
      if (res.data) setManualEditJson(JSON.stringify(res.data, null, 2));
      toast.success(res.data ? 'Updated!' : 'Response received');
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
        aiModel: 'gpt-4o-mini',
        originalInput: activeThread.prompt,
      };
      const res = await saveVisualization(
        title, activeThread.type, activeThread.data, metadata,
        isPublic, activeThread.vizId || undefined,
        activeThread.chatHistory as { role:'user'|'assistant'; content:string; timestamp:Date|string }[],
      );
      if (!res.success) { toast.error(res.error || 'Save failed'); return; }
      const newVizId = res.data?._id;
      const wasSaved = activeThread.isSaved;
      setThreads(p => p.map(t => t.id === id ? { ...t, vizId: newVizId || t.vizId, isSaved: true } : t));
      toast.success(wasSaved ? 'Updated!' : 'Saved!');
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  }, [activeThread, isSignedIn, isPublic]);

  const handleShare = useCallback(() => {
    if (!activeThread?.vizId) { toast.error('Save the visualization first to share'); return; }
    const url = `${window.location.origin}/dashboard?id=${activeThread.vizId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  }, [activeThread]);

  const handleExpand = useCallback(async (nodeId: string, nodeLabel: string) => {
    if (!activeThread) return;
    const id = activeThread.id;
    try {
      if (activeThread.type === 'network_graph') {
        const d = activeThread.data as NetworkGraphData;
        const res = await expandNodeAction(nodeId, nodeLabel, activeThread.prompt, d.nodes.map(n => n.label));
        if (res.success && res.data) {
          const nd = res.data as NetworkGraphData;
          const newData = { ...d, nodes: [...d.nodes, ...nd.nodes], edges: [...d.edges, ...nd.edges] };
          setThreads(p => p.map(t => t.id === id ? { ...t, data: newData } : t));
        }
      } else if (activeThread.type === 'mind_map') {
        const d = activeThread.data as MindMapData;
        const getAllIds = (n: MindMapNode): string[] => [n.id, ...(n.children?.flatMap(getAllIds) || [])];
        const res = await expandMindMapNodeAction(nodeId, nodeLabel, activeThread.prompt, getAllIds(d.root));
        if (res.success && res.data) {
          const newData = { root: updateMindMapNode(d.root, nodeId, res.data as MindMapNode[]) };
          setThreads(p => p.map(t => t.id === id ? { ...t, data: newData } : t));
        }
      }
    } catch { toast.error('Failed to expand node.'); }
  }, [activeThread]);

  const handleManualEdit = useCallback(() => {
    if (!manualEditJson.trim() || !activeThread) { toast.error('Enter valid JSON'); return; }
    try {
      const parsed = JSON.parse(manualEditJson);
      const id = activeThread.id;
      setThreads(p => p.map(t => t.id === id ? { ...t, data: parsed } : t));
      toast.success('Updated!');
    } catch { toast.error('Invalid JSON.'); }
  }, [manualEditJson, activeThread]);

  const handleNew = useCallback(() => setActiveId(null), []);

  /* ── Loading overlay step text ── */
  const stepText =
    loadingStep === 'analyzing'  ? 'Analyzing your input…' :
    loadingStep === 'generating' ? 'Generating visualization…' :
    loadingStep === 'finalizing' ? 'Finalizing…' : 'Processing…';

  return (
    <div
      className="text-stone-200 flex flex-col h-screen w-full antialiased overflow-hidden"
      style={{ background: '#0a0d11' }}
    >
      <Header user={user || null} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left: Thread panel ── */}
        <div
          className="w-[340px] shrink-0 flex flex-col"
          style={{ background: '#0f1419', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
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
            autoSelect={autoSelect}
            setAutoSelect={setAutoSelect}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>

        {/* ── Right: Focus panel ── */}
        <div className="flex-1 relative overflow-hidden min-w-0">
          {/* Generation overlay */}
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: 'rgba(10,13,17,0.92)',
                  border: '1px solid rgba(139,92,246,0.28)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
                  backdropFilter: 'blur(16px)',
                  color: '#c4b5fd',
                }}
              >
                <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin shrink-0" />
                <span>{stepText}</span>
              </div>
            </div>
          )}

          <FocusPanel
            thread={activeThread}
            saving={saving}
            onSave={handleSave}
            onShare={handleShare}
            onExpand={handleExpand}
            chatHistory={activeThread?.chatHistory || []}
            handleChatMessage={handleChatMessage}
            isEditing={isEditing}
            manualEditJson={manualEditJson}
            setManualEditJson={setManualEditJson}
            handleManualEdit={handleManualEdit}
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
