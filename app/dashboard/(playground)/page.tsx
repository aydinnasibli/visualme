'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { generateVisualization, saveVisualization, expandNodeAction, expandMindMapNodeAction, getVisualizationById, editVisualizationAction } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData, MindMapData, VisualizationType, MindMapNode, TreeDiagramData, TimelineData, GanttChartData, SavedVisualization } from '@/lib/types/visualization';
import { toast } from 'sonner';

// Import the new components
import Header from '@/components/dashboard/Header';
import Canvas from '@/components/dashboard/Canvas';
import Toolbar from '@/components/dashboard/Toolbar';
import InputArea from '@/components/dashboard/InputArea';
import SideActions from '@/components/dashboard/SideActions';
import EditPanel from '@/components/dashboard/EditPanel';

// Define handle types
import type { NetworkGraphHandle } from '@/components/visualizations/NetworkGraph';
import type { MindMapHandle } from '@/components/visualizations/MindMap';

const LoadingPlaceholder = () => (
  <div className="w-full h-full bg-surface-dark rounded-lg flex items-center justify-center border border-border-color animate-pulse">
    <span className="text-stone-500 font-medium text-sm">Loading visualization...</span>
  </div>
);

// Dynamic imports for visualization components
const DynamicNetworkGraph = dynamic(() => import('@/components/visualizations/NetworkGraph'), { ssr: false, loading: LoadingPlaceholder });
const DynamicMindMap = dynamic(() => import('@/components/visualizations/MindMap'), { ssr: false, loading: LoadingPlaceholder });
const DynamicTreeDiagram = dynamic(() => import('@/components/visualizations/TreeDiagram'), { ssr: false, loading: LoadingPlaceholder });
const DynamicTimeline = dynamic(() => import('@/components/visualizations/Timeline'), { ssr: false, loading: LoadingPlaceholder });
const DynamicGanttChart = dynamic(() => import('@/components/visualizations/GanttChart'), { ssr: false, loading: LoadingPlaceholder });

function DashboardContent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing' | 'generating' | 'finalizing' | null>(null);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualEditJson, setManualEditJson] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date | string}>>([]);
  const [vizId, setVizId] = useState<string | null>(null);

  // References for visualization controls
  const networkGraphRef = useRef<NetworkGraphHandle>(null);
  const mindMapRef = useRef<MindMapHandle>(null);

  // Search Param Handling
  useEffect(() => {
    const idFromUrl = searchParams.get('id');

    const loadFromId = async (id: string) => {
      // Prevent redundant loading if already loaded
      if (vizId === id) return;

      setLoading(true);
      setLoadingStep('analyzing');
      try {
        const res = await getVisualizationById(id);
        if (res.success && res.data) {
          const viz = res.data as SavedVisualization;
          setResult({
             success: true,
             type: viz.type,
             data: viz.data,
             title: viz.title,
             reason: 'Loaded from history',
             metadata: viz.metadata,
          });
          setVizId(viz._id || null);
          setIsSaved(true);
          setChatHistory(viz.history || []);
          setManualEditJson(JSON.stringify(viz.data, null, 2));
          toast.success(`Loaded "${viz.title}"`);
        } else {
          toast.error(res.error || 'Failed to load visualization');
        }
      } catch (err) {
        console.error("Load by ID failed", err);
        toast.error("Failed to load visualization");
      } finally {
        setLoading(false);
        setLoadingStep(null);
      }
    };

    if (idFromUrl) {
      loadFromId(idFromUrl);
    } else {
      // Legacy session check only if no ID in URL
      const revisualizeData = sessionStorage.getItem('revisualize_data');
      if (revisualizeData) {
        try {
          const parsed: SavedVisualization = JSON.parse(revisualizeData);
          setResult({
            success: true,
            type: parsed.type,
            data: parsed.data,
            title: parsed.title,
            reason: 'Loaded from saved visualization',
            metadata: parsed.metadata
          });
          setVizId(parsed._id || null);
          setIsSaved(true);
          if (parsed.history) {
            setChatHistory(parsed.history);
          }
          setManualEditJson(JSON.stringify(parsed.data, null, 2));
          sessionStorage.removeItem('revisualize_data');
          toast.success(`Loaded "${parsed.title}" for editing`);
        } catch (e) {
          console.error("Failed to load revisualize data", e);
          toast.error("Failed to load visualization data");
        }
      } else {
        // Reset if no ID and no session data (user navigated to new visualization)
        setResult(null);
        setVizId(null);
        setIsSaved(false);
        setChatHistory([]);
        setInput('');
      }
    }
  }, [searchParams]); // Depend on searchParams to trigger re-run

  const updateMindMapNode = (root: MindMapNode, nodeId: string, newChildren: MindMapNode[]): MindMapNode => {
    if (root.id === nodeId) {
      return { ...root, children: [...(root.children || []), ...newChildren] };
    }
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => updateMindMapNode(child, nodeId, newChildren))
      };
    }
    return root;
  };

  const handleExpand = async (nodeId: string, nodeLabel: string) => {
    if (!result) return;
    try {
      if (result.type === 'network_graph') {
        const currentData = result.data as NetworkGraphData;
        const existingNodeLabels = currentData.nodes.map(n => n.label);
        const response = await expandNodeAction(nodeId, nodeLabel, input, existingNodeLabels);
        if (response.success && response.data) {
          const newData = response.data as NetworkGraphData;
          setResult(prev => prev ? { ...prev, data: { ...currentData, nodes: [...currentData.nodes, ...newData.nodes], edges: [...currentData.edges, ...newData.edges] } } : null);
        }
      } else if (result.type === 'mind_map') {
        const currentData = result.data as MindMapData;
        const getAllIds = (node: MindMapNode): string[] => [node.id, ...(node.children?.flatMap(getAllIds) || [])];
        const existingNodeIds = getAllIds(currentData.root);
        const response = await expandMindMapNodeAction(nodeId, nodeLabel, input, existingNodeIds);
        if (response.success && response.data) {
          const newChildren = response.data as MindMapNode[];
          setResult(prev => prev ? { ...prev, data: { ...(prev.data as MindMapData), root: updateMindMapNode((prev.data as MindMapData).root, nodeId, newChildren) } } : null);
        }
      }
    } catch (err) {
      console.error('Error expanding node:', err);
      toast.error('Failed to expand node.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Please enter some text');
      return;
    }

    // Branching Logic: Edit existing OR Generate new
    if (result) {
      // --- EDIT MODE ---
      setLoading(true); // Show loading state
      const currentInput = input;
      setInput(''); // Optimistic clear

      try {
        await handleChatMessage(currentInput);
      } catch (err) {
        setInput(currentInput); // Restore on error
        console.error("Edit failed", err);
      } finally {
        setLoading(false);
      }
    } else {
      // --- GENERATE MODE ---
      setLoading(true);
      setError(null);
      setResult(null);
      setVizId(null);
      setChatHistory([]);
      try {
        setLoadingStep('analyzing');
        const generatingTimer = setTimeout(() => setLoadingStep('generating'), 200);

        const data = await generateVisualization(input.trim(), (!autoSelect && selectedType) ? (selectedType as VisualizationType) : undefined);
        clearTimeout(generatingTimer);

        if (!data.success) {
          setError(data.error || 'Failed to generate visualization');
          toast.error(data.error || 'Failed to generate visualization');
          setLoading(false);
          setLoadingStep(null);
          return;
        }

        setLoadingStep('finalizing');
        await new Promise(resolve => setTimeout(resolve, 500));

        setResult(data);

        // Inject reason into chat history
        if (data.reason) {
            setChatHistory([{
                role: 'assistant',
                content: data.reason,
                timestamp: new Date()
            }]);
        }

        setManualEditJson(JSON.stringify(data.data, null, 2));
        setInput(''); // Clear input after generation
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Error:', err);
        toast.error('An unexpected error occurred.');
      } finally {
        setLoading(false);
        setLoadingStep(null);
      }
    }
  };

  const handleSave = async () => {
    if (!result || !isSignedIn) {
      toast.error('Please sign in to save visualizations');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const title = result.title || input.substring(0, 100) || 'Untitled Visualization';
      const metadata = {
        generatedAt: new Date(),
        aiModel: 'gpt-4o-mini',
        originalInput: input,
        ...(result.metadata || {}),
      };
      const saveResult = await saveVisualization(
        title,
        result.type,
        result.data,
        metadata,
        false, // isPublic default
        vizId || undefined,
        chatHistory as { role: 'user' | 'assistant'; content: string; timestamp: Date | string }[]
      );
      if (!saveResult.success) {
        setError(saveResult.error || 'Failed to save visualization');
        toast.error(saveResult.error || 'Failed to save visualization');
        return;
      }
      if (saveResult.data && saveResult.data._id) {
        setVizId(saveResult.data._id);
      }
      const wasAlreadySaved = isSaved;
      setIsSaved(true);
      toast.success(wasAlreadySaved ? 'Visualization updated successfully!' : 'Visualization saved successfully!');
    } catch (err) {
      setError('An error occurred while saving');
      console.error('Error saving visualization:', err);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleChatMessage = async (message: string): Promise<void> => {
    if (!result) return;
    setIsEditing(true);

    const newHistory = [
      ...chatHistory,
      { role: 'user' as const, content: message, timestamp: new Date() }
    ];
    setChatHistory(newHistory);

    try {
      const response = await editVisualizationAction(
          message.trim(),
          result.type,
          result.data,
          newHistory
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to process request");
      }

      // Update history with assistant response
      const assistantMessage = response.message || (response.data ? 'I have updated the visualization based on your request.' : 'I processed your request.');

      const updatedHistory = [
          ...newHistory,
          { role: 'assistant' as const, content: assistantMessage, timestamp: new Date() }
      ];
      setChatHistory(updatedHistory);

      // If data was updated, apply it
      if (response.data) {
          setResult({
            ...result,
            data: response.data,
          });
          setManualEditJson(JSON.stringify(response.data, null, 2));
          toast.success('Visualization updated successfully!');
      } else {
          // Just a text reply
          toast.success('Reply received');
      }

    } catch (error) {
       console.error("Edit error:", error);
       toast.error(error instanceof Error ? error.message : "Failed to edit visualization");
       setChatHistory([
        ...newHistory,
        { role: 'assistant' as const, content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp: new Date() }
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleManualEdit = () => {
    if (!manualEditJson.trim()) {
      toast.error('Please enter valid JSON data');
      return;
    }
    try {
      const parsedData = JSON.parse(manualEditJson);
      if (!result) return;
      setResult({
        ...result,
        data: parsedData,
      });
      setIsEditPanelOpen(false);
      toast.success('Visualization updated successfully!');
    } catch (error) {
      toast.error('Invalid JSON format. Please check your data.');
    }
  };

  const handleZoomIn = () => {
    if (result?.type === 'network_graph' && networkGraphRef.current) {
      networkGraphRef.current.zoomIn();
    } else if (result?.type === 'mind_map' && mindMapRef.current) {
      mindMapRef.current.zoomIn();
    } else {
      toast.info("Zoom in not available for this visualization type.");
    }
  };

  const handleZoomOut = () => {
    if (result?.type === 'network_graph' && networkGraphRef.current) {
      networkGraphRef.current.zoomOut();
    } else if (result?.type === 'mind_map' && mindMapRef.current) {
      mindMapRef.current.zoomOut();
    } else {
      toast.info("Zoom out not available for this visualization type.");
    }
  };

  const handleReset = () => {
    if (result?.type === 'network_graph' && networkGraphRef.current) {
        networkGraphRef.current.fit();
    } else if (result?.type === 'mind_map' && mindMapRef.current) {
        mindMapRef.current.fitView();
    } else {
        toast.info("Reset view not available for this visualization type.");
    }
  };

  return (
    <div className="bg-background-dark text-stone-200 font-display overflow-hidden flex flex-col h-screen w-full antialiased selection:bg-primary/20 relative">
      <Header user={user || null} />
      <main className="flex-1 w-full h-full relative z-0 flex flex-col">
        <Toolbar
            onReset={handleReset}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
        />
        <div className="w-full h-full bg-background-dark grid-bg relative flex items-center justify-center overflow-hidden p-4">
            <div className="w-full h-full relative">
            {result ? (
                <>
                {result.type === 'network_graph' && <DynamicNetworkGraph ref={networkGraphRef} data={result.data as NetworkGraphData} onExpand={handleExpand} />}
                {result.type === 'mind_map' && <DynamicMindMap ref={mindMapRef} data={result.data as MindMapData} onExpand={handleExpand} />}
                {result.type === 'tree_diagram' && <DynamicTreeDiagram data={result.data as TreeDiagramData} onExpand={handleExpand} />}
                {result.type === 'timeline' && <DynamicTimeline data={result.data as TimelineData} />}
                {result.type === 'gantt_chart' && <DynamicGanttChart data={result.data as GanttChartData} />}
                </>
            ) : (
                <Canvas />
            )}
            </div>
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
        />
        <SideActions
          handleSave={handleSave}
          isSaved={isSaved}
          saving={saving}
          toggleEditPanel={() => setIsEditPanelOpen(!isEditPanelOpen)}
        />
        {isEditPanelOpen && result && (
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
    <Suspense fallback={<LoadingPlaceholder />}>
      <DashboardContent />
    </Suspense>
  );
}
