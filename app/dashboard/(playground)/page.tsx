'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
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
import dynamic from 'next/dynamic';

import Header from '@/components/dashboard/Header';
import Toolbar from '@/components/dashboard/Toolbar';
import InputArea from '@/components/dashboard/InputArea';
import SideActions from '@/components/dashboard/SideActions';
import EditPanel from '@/components/dashboard/EditPanel';
import type { GridCanvasHandle } from '@/components/canvas/GridCanvas';

const Loading = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
  </div>
);

const DynamicGridCanvas = dynamic(
  () => import('@/components/canvas/GridCanvas'),
  { ssr: false, loading: Loading }
);

/* ── Helpers ── */
const updateMindMapNode = (root: MindMapNode, nodeId: string, newChildren: MindMapNode[]): MindMapNode => {
  if (root.id === nodeId) return { ...root, children: [...(root.children || []), ...newChildren] };
  if (root.children) return { ...root, children: root.children.map((c) => updateMindMapNode(c, nodeId, newChildren)) };
  return root;
};

/* ── Dashboard ── */
function DashboardContent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing'|'generating'|'finalizing'|null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [isSaved, setIsSaved]     = useState(false);
  const [isPublic, setIsPublic]   = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualEditJson, setManualEditJson] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role:'user'|'assistant'; content:string; timestamp:Date|string}>>([]);
  const [vizId, setVizId]         = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<VisualizationResponse | null>(null);

  // Canvas state
  const canvasRef   = useRef<GridCanvasHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(600);
  const [zoom, setZoomLocal]  = useState(1);
  const [widgetCount, setWidgetCount] = useState(0);
  const [connectMode, setConnectMode] = useState(false);

  // Track canvas dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasW(width);
      setCanvasH(height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Zoom: canvas is always the source of truth — it fires onZoomChange for every change (button OR ctrl+scroll)
  const handleZoomIn  = () => canvasRef.current?.zoomIn();
  const handleZoomOut = () => canvasRef.current?.zoomOut();
  const handleFitAll  = () => canvasRef.current?.fitAll();
  const handleClear   = () => {
    if (!widgetCount) return;
    canvasRef.current?.clear();
    setWidgetCount(0);
    setActiveResult(null);
    setActiveWidgetId(null);
    setVizId(null);
    setIsSaved(false);
    setChatHistory([]);
  };
  const handleToggleConnect = () => setConnectMode((p) => !p);

  const handleShare = () => {
    if (!vizId) { toast.error('Save the visualization first to share'); return; }
    const url = `${window.location.origin}/dashboard?id=${vizId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleExportCode = () => toast.info('Export feature coming soon!');
  const handleOptions = () => toast.info('Options coming soon!');

  // Keyboard shortcuts: Ctrl+= / Ctrl+-
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); }
      if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from URL / session
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    const loadById = async (id: string) => {
      if (vizId === id) return;
      setLoading(true); setLoadingStep('analyzing');
      try {
        const res = await getVisualizationById(id);
        if (res.success && res.data) {
          const viz = res.data as SavedVisualization;
          const wId = canvasRef.current?.addWidget({ type: viz.type, data: viz.data, title: viz.title || 'Visualization' });
          setWidgetCount((c) => c + 1);
          setActiveWidgetId(wId ?? null);
          setActiveResult({ success: true, type: viz.type, data: viz.data, title: viz.title, reason: '', metadata: viz.metadata });
          setVizId(viz._id || null);
          setIsSaved(true);
          setChatHistory(viz.history || []);
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
        const wId = canvasRef.current?.addWidget({ type: parsed.type, data: parsed.data, title: parsed.title || 'Visualization' });
        setWidgetCount((c) => c + 1);
        setActiveWidgetId(wId ?? null);
        setActiveResult({ success: true, type: parsed.type, data: parsed.data, title: parsed.title, reason: '', metadata: parsed.metadata });
        setVizId(parsed._id || null);
        setIsSaved(true);
        if (parsed.history) setChatHistory(parsed.history);
        setManualEditJson(JSON.stringify(parsed.data, null, 2));
        sessionStorage.removeItem('revisualize_data');
        toast.success(`Loaded "${parsed.title}"`);
      } catch { toast.error('Failed to load visualization data'); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleExpand = useCallback(async (_wId: string, nodeId: string, nodeLabel: string) => {
    if (!activeResult) return;
    try {
      if (activeResult.type === 'network_graph') {
        const d = activeResult.data as NetworkGraphData;
        const res = await expandNodeAction(nodeId, nodeLabel, input, d.nodes.map((n) => n.label));
        if (res.success && res.data) {
          const nd = res.data as NetworkGraphData;
          const newData = { ...d, nodes: [...d.nodes, ...nd.nodes], edges: [...d.edges, ...nd.edges] };
          setActiveResult({ ...activeResult, data: newData });
          canvasRef.current?.updateWidget(_wId, newData);
        }
      } else if (activeResult.type === 'mind_map') {
        const d = activeResult.data as MindMapData;
        const getAllIds = (n: MindMapNode): string[] => [n.id, ...(n.children?.flatMap(getAllIds) || [])];
        const res = await expandMindMapNodeAction(nodeId, nodeLabel, input, getAllIds(d.root));
        if (res.success && res.data) {
          const newData = { root: updateMindMapNode(d.root, nodeId, res.data as MindMapNode[]) };
          setActiveResult({ ...activeResult, data: newData });
          canvasRef.current?.updateWidget(_wId, newData);
        }
      }
    } catch { toast.error('Failed to expand node.'); }
  }, [activeResult, input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) { setError('Please enter some text'); return; }

    if (activeResult) {
      // Edit mode
      setLoading(true);
      const cur = input; setInput('');
      try { await handleChatMessage(cur); } catch { setInput(cur); }
      finally { setLoading(false); }
      return;
    }

    // Generate new widget
    setLoading(true); setError(null); setVizId(null); setChatHistory([]);
    try {
      setLoadingStep('analyzing');
      const genTimer = setTimeout(() => setLoadingStep('generating'), 250);
      const data = await generateVisualization(
        input.trim(),
        (!autoSelect && selectedType) ? (selectedType as VisualizationType) : undefined
      );
      clearTimeout(genTimer);

      if (!data.success) {
        setError(data.error || 'Generation failed');
        toast.error(data.error || 'Generation failed');
        return;
      }

      setLoadingStep('finalizing');
      await new Promise((r) => setTimeout(r, 350));

      const wId = canvasRef.current?.addWidget({
        type: data.type,
        data: data.data,
        title: data.title || input.slice(0, 60),
      });
      setWidgetCount((c) => c + 1);
      setActiveWidgetId(wId ?? null);
      setActiveResult(data);
      setManualEditJson(JSON.stringify(data.data, null, 2));
      setIsSaved(false);
      setInput('');
    } catch (err) {
      setError('An error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false); setLoadingStep(null);
    }
  };

  const handleSave = async () => {
    if (!activeResult || !isSignedIn) { toast.error('Please sign in to save'); return; }
    setSaving(true);
    try {
      const title = activeResult.title || input.slice(0, 100) || 'Untitled';
      const metadata = { generatedAt: new Date(), aiModel: 'gpt-4o-mini', originalInput: input, ...(activeResult.metadata || {}) };
      const res = await saveVisualization(title, activeResult.type, activeResult.data, metadata, isPublic, vizId || undefined,
        chatHistory as { role:'user'|'assistant'; content:string; timestamp:Date|string }[]);
      if (!res.success) { toast.error(res.error || 'Save failed'); return; }
      if (res.data?._id) setVizId(res.data._id);
      const was = isSaved; setIsSaved(true);
      toast.success(was ? 'Updated!' : 'Saved!');
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const handleChatMessage = async (message: string) => {
    if (!activeResult) return;
    setIsEditing(true);
    const newHist = [...chatHistory, { role: 'user' as const, content: message, timestamp: new Date() }];
    setChatHistory(newHist);
    try {
      const res = await editVisualizationAction(message.trim(), activeResult.data, activeResult.type, vizId || undefined, newHist);
      if (!res.success) throw new Error(res.error || 'Edit failed');
      if (res.data) {
        setActiveResult({ ...activeResult, data: res.data });
        setManualEditJson(JSON.stringify(res.data, null, 2));
        if (activeWidgetId) canvasRef.current?.updateWidget(activeWidgetId, res.data);
      }
      setChatHistory([...newHist, { role: 'assistant' as const, content: res.message || 'Done.', timestamp: new Date() }]);
      toast.success(res.data ? 'Updated!' : 'Response received');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Edit failed');
      setChatHistory([...newHist, { role: 'assistant' as const, content: `Error: ${err instanceof Error ? err.message : 'Unknown'}`, timestamp: new Date() }]);
    } finally { setIsEditing(false); }
  };

  const handleManualEdit = () => {
    if (!manualEditJson.trim()) { toast.error('Enter valid JSON'); return; }
    try {
      const parsed = JSON.parse(manualEditJson);
      if (!activeResult) return;
      setActiveResult({ ...activeResult, data: parsed });
      if (activeWidgetId) canvasRef.current?.updateWidget(activeWidgetId, parsed);
      setIsEditPanelOpen(false);
      toast.success('Updated!');
    } catch { toast.error('Invalid JSON.'); }
  };

  return (
    <div className="bg-background-dark text-stone-200 overflow-hidden flex flex-col h-screen w-full antialiased">
      <Header user={user || null} />

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative grid-bg overflow-hidden">
          {/* Canvas-level toolbar — floats above canvas */}
          <div className="absolute inset-x-0 top-0 pointer-events-none z-20">
            <div className="pointer-events-auto">
              <Toolbar
                zoom={zoom}
                widgetCount={widgetCount}
                connectMode={connectMode}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitAll={handleFitAll}
                onClear={handleClear}
                onToggleConnect={handleToggleConnect}
              />
            </div>
          </div>

          {/* Generation loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: "rgba(13,17,23,0.9)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
                  backdropFilter: "blur(16px)",
                  color: "#c4b5fd",
                }}
              >
                <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin shrink-0" />
                <span>
                  {loadingStep === "analyzing"  && "Analyzing your input…"}
                  {loadingStep === "generating" && "Generating visualization…"}
                  {loadingStep === "finalizing" && "Finalizing…"}
                  {!loadingStep               && "Processing…"}
                </span>
              </div>
            </div>
          )}

          <DynamicGridCanvas
            ref={canvasRef}
            containerWidth={canvasW}
            containerHeight={canvasH}
            onExpand={handleExpand}
            onZoomChange={setZoomLocal}
          />
        </div>

        <InputArea
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          loading={loading}
          autoSelect={autoSelect}
          setAutoSelect={setAutoSelect}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          onOptions={handleOptions}
        />

        <SideActions
          handleSave={handleSave}
          isSaved={isSaved}
          saving={saving}
          toggleEditPanel={() => setIsEditPanelOpen((p) => !p)}
          onShare={handleShare}
          onExportCode={handleExportCode}
        />

        {isEditPanelOpen && activeResult && (
          <EditPanel
            chatHistory={chatHistory}
            handleChatMessage={handleChatMessage}
            isEditing={isEditing}
            manualEditJson={manualEditJson}
            setManualEditJson={setManualEditJson}
            handleManualEdit={handleManualEdit}
          />
        )}
      </main>
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
