'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@clerk/nextjs';
import { generateVisualization, saveVisualization, expandNodeAction, expandMindMapNodeAction, editDraftVisualization } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData, MindMapData, VisualizationType, MindMapNode, TreeDiagramData, TimelineData, GanttChartData, SavedVisualization } from '@/lib/types/visualization';
import { Edit3, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ChatSidebar from '@/components/visualizations/ChatSidebar';

const LoadingPlaceholder = () => (
  <div className="w-full h-full bg-[#1a1f28] rounded-2xl flex items-center justify-center border border-[#282e39] animate-pulse">
    <span className="text-gray-500 font-medium text-sm">Loading visualization...</span>
  </div>
);

const DynamicNetworkGraph = dynamic(() => import('@/components/visualizations/NetworkGraph'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

const DynamicMindMap = dynamic(() => import('@/components/visualizations/MindMap'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

const DynamicTreeDiagram = dynamic(() => import('@/components/visualizations/TreeDiagram'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

const DynamicTimeline = dynamic(() => import('@/components/visualizations/Timeline'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

const DynamicGanttChart = dynamic(() => import('@/components/visualizations/GanttChart'), {
  ssr: false,
  loading: LoadingPlaceholder,
});

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing' | 'generating' | 'finalizing' | null>(null);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorScheme, setColorScheme] = useState('modern-dark');
  const [dataDensity, setDataDensity] = useState('balanced');
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState<'ai' | 'manual'>('ai');
  const [manualEditJson, setManualEditJson] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date | string}>>([]);
  const [vizId, setVizId] = useState<string | null>(null);

  // Check for revisualize data on mount
  useEffect(() => {
    const revisualizeData = sessionStorage.getItem('revisualize_data');
    if (revisualizeData) {
      try {
        const parsed: SavedVisualization = JSON.parse(revisualizeData);
        setResult({
          success: true,
          type: parsed.type,
          data: parsed.data,
          title: parsed.title,
          metadata: parsed.metadata
        });
        setVizId(parsed._id || null);
        setIsSaved(true);
        if (parsed.history) {
          setChatHistory(parsed.history);
        }

        // Populate manual edit JSON
        setManualEditJson(JSON.stringify(parsed.data, null, 2));

        // Clear storage
        sessionStorage.removeItem('revisualize_data');
        toast.success(`Loaded "${parsed.title}" for editing`);
      } catch (e) {
        console.error("Failed to load revisualize data", e);
        toast.error("Failed to load visualization data");
      }
    }
  }, []);

  // Helper to recursively find and update a node in the Mind Map tree
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
          setResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              data: {
                ...currentData,
                nodes: [...currentData.nodes, ...newData.nodes],
                edges: [...currentData.edges, ...newData.edges]
              }
            };
          });
        }
      } else if (result.type === 'mind_map') {
        const currentData = result.data as MindMapData;
        // Collect all existing IDs to avoid duplicates (simplified)
        const getAllIds = (node: MindMapNode): string[] => {
          const ids = [node.id];
          if (node.children) {
            node.children.forEach(child => ids.push(...getAllIds(child)));
          }
          return ids;
        };
        const existingNodeIds = getAllIds(currentData.root);

        const response = await expandMindMapNodeAction(nodeId, nodeLabel, input, existingNodeIds);

        if (response.success && response.data) {
          const newChildren = response.data as MindMapNode[];
          setResult(prev => {
            if (!prev) return null;
            const prevData = prev.data as MindMapData;
            return {
              ...prev,
              data: {
                ...prevData,
                root: updateMindMapNode(prevData.root, nodeId, newChildren)
              }
            };
          });
        }
      } else if (result.type === 'tree_diagram') {
        // Reuse mind map expansion logic
        const existingIds: string[] = [];

        const response = await expandMindMapNodeAction(nodeId, nodeLabel, input, existingIds);

        if (response.success && response.data) {
          const newMindMapNodes = response.data as MindMapNode[];
          // Map MindMapNode to TreeDiagramData
          const newTreeNodes = newMindMapNodes.map(n => ({
            name: n.content,
            attributes: {
              description: n.description,
              extendable: n.extendable
            },
            children: []
          }));

          // Recursive update for TreeDiagram
          const updateTree = (node: any): any => {
            if (node.name === nodeLabel) {
               return { ...node, children: [...(node.children || []), ...newTreeNodes] };
            }
            if (node.children) {
              return { ...node, children: node.children.map(updateTree) };
            }
            return node;
          };

          setResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              data: updateTree(prev.data)
            };
          });
        }
      }
    } catch (err) {
      console.error('Error expanding node:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter some text to visualize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setVizId(null);
    setChatHistory([]);

    try {
      setLoadingStep('analyzing');
      const generatingTimer = setTimeout(() => setLoadingStep('generating'), 200);

      const data = await generateVisualization(
        input.trim(),
        (!autoSelect && selectedType) ? (selectedType as VisualizationType) : undefined
      );
      clearTimeout(generatingTimer);

      if (!data.success) {
        setError(data.error || 'Failed to generate visualization');
        return;
      }

      setLoadingStep('finalizing');
      await new Promise(resolve => setTimeout(resolve, 150));

      setResult(data);
      setManualEditJson(JSON.stringify(data.data, null, 2));
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const handleSave = async () => {
    if (!result || !isSignedIn) {
      setError('Please sign in to save visualizations');
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

      // If we have an ID (from revisualize), we should technically update that specific doc
      // But saveVisualization is simpler, let's see.
      // If we want to overwrite, we need to handle that logic.
      // Current saveVisualization creates new.
      // User requirement said "if needed save it again".
      // Usually "save" on an existing one implies update, but for now let's use the standard flow.
      // If `vizId` is present, we are editing an existing one.

      // NOTE: `saveVisualization` implementation in `actions/profile` or `actions/visualize` likely creates a new one.
      // Given the requirement "save it again", creating a new version or updating is acceptable.
      // Let's stick to standard save for now.

      const saveResult = await saveVisualization(
        title,
        result.type,
        result.data,
        metadata,
        vizId || undefined, // Pass ID if updating existing
        chatHistory // Pass chat history to save
      );

      if (!saveResult.success) {
        setError(saveResult.error || 'Failed to save visualization');
        return;
      }

      // If we created a new one, update ID
      if (saveResult.data && saveResult.data._id) {
        setVizId(saveResult.data._id);
      }

      const wasAlreadySaved = isSaved;
      setIsSaved(true);
      toast.success(wasAlreadySaved ? 'Visualization updated successfully!' : 'Visualization saved successfully!');
    } catch (err) {
      setError('An error occurred while saving');
      console.error('Error saving visualization:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!result) return;
    setIsEditing(true);

    const newHistory = [
      ...chatHistory,
      { role: 'user' as const, content: message, timestamp: new Date() }
    ];
    setChatHistory(newHistory);

    try {
      // If we have a vizId, we can use the specific edit endpoint that tracks history on the backend
      // But here we are in "draft" mode often.
      // We can use the generic `api/visualizations/edit` endpoint we used in the modal.

      const response = await fetch("/api/visualizations/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualizationId: vizId, // Pass ID if available
          editPrompt: message.trim(),
          existingData: result.data,
          visualizationType: result.type,
          messages: newHistory
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit visualization");
      }

      const { visualization } = await response.json();

      // The API returns a saved visualization object usually.
      // If we were in draft mode (no ID), the API might have created a temporary one or just returned data.
      // Let's assume it returns { visualization: { data: ..., ... } }

      setResult({
        ...result,
        data: visualization.data,
      });
      setManualEditJson(JSON.stringify(visualization.data, null, 2));

      setChatHistory([
        ...newHistory,
        { role: 'assistant' as const, content: 'I have updated the visualization based on your request.', timestamp: new Date() }
      ]);

      toast.success('Visualization updated successfully!');

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
      setManualEditJson('');
      setIsEditMode(false);
      toast.success('Visualization updated successfully!');
    } catch (error) {
      toast.error('Invalid JSON format. Please check your data.');
    }
  };

  const handleEditModeToggle = () => {
    if (!isEditMode && result) {
      // When opening edit mode, populate manual edit JSON
      setManualEditJson(JSON.stringify(result.data, null, 2));
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with AI Auto-Select */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Visualization</h1>
            <p className="text-gray-400">Transform your data into beautiful visualizations</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
            <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
            <span className="text-sm font-bold text-primary">AI Auto-Select</span>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={autoSelect}
                onChange={(e) => setAutoSelect(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2a2f38] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#2a2f38] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-[#141922] rounded-2xl border border-[#282e39] p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white block">
                Data Story Prompt
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 bg-[#1a1f28] border border-[#2a2f38] rounded-xl p-4 text-sm text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed placeholder:text-gray-500"
                placeholder="Example: Create a breakdown of quarterly sales by region for 2023, emphasizing the growth in the Asia-Pacific market..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white block">Source Data</label>
              <div className="border-2 border-dashed border-[#2a2f38] rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-[#1a1f28]/30 hover:bg-[#1a1f28] transition-colors cursor-pointer group">
                <div className="size-12 rounded-full bg-[#2a2f38] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-gray-400">upload_file</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">CSV, JSON, or Excel (Max 50MB)</p>
                </div>
              </div>
            </div>

            {/* Advanced Parameters */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-4 rounded-xl border border-[#2a2f38] bg-[#1a1f28] hover:bg-[#1e2329] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">tune</span>
                <span className="text-sm font-medium text-white">Advanced Parameters</span>
              </div>
              <span className={`material-symbols-outlined text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {showAdvanced && (
              <div className="p-4 rounded-xl border border-[#2a2f38] bg-[#1a1f28] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-2 block">
                      Color Scheme
                    </label>
                    <select
                      value={colorScheme}
                      onChange={(e) => setColorScheme(e.target.value)}
                      className="w-full bg-[#0f1419] border border-[#2a2f38] rounded-lg text-sm p-2.5 text-gray-300 focus:ring-2 focus:ring-primary"
                    >
                      <option value="modern-dark">Modern Dark</option>
                      <option value="classic-light">Classic Light</option>
                      <option value="vibrant">Vibrant</option>
                      <option value="pastel">Pastel</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-2 block">
                      Data Density
                    </label>
                    <select
                      value={dataDensity}
                      onChange={(e) => setDataDensity(e.target.value)}
                      className="w-full bg-[#0f1419] border border-[#2a2f38] rounded-lg text-sm p-2.5 text-gray-300 focus:ring-2 focus:ring-primary"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="high">High Detail</option>
                      <option value="simplified">Simplified</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {loadingStep === 'analyzing' && 'Analyzing...'}
                    {loadingStep === 'generating' && 'Generating...'}
                    {loadingStep === 'finalizing' && 'Finalizing...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                    Generate Visualization
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Visualization Output */}
        {result ? (
          <div className="bg-[#141922] rounded-2xl border border-[#282e39] p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Visualization</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleEditModeToggle}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    isEditMode
                      ? 'bg-primary text-white'
                      : 'bg-[#1a1f28] border border-[#2a2f38] text-white hover:bg-[#1e2329]'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="text-sm font-medium">{isEditMode ? 'Cancel Edit' : 'Edit'}</span>
                </button>
                {isSignedIn && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSaved
                        ? 'bg-green-600 hover:bg-green-700 shadow-green-500/25'
                        : 'bg-primary hover:bg-blue-600 shadow-primary/25'
                    }`}
                    title={isSaved ? 'Update saved visualization' : 'Save Visualization'}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">{isSaved ? 'check_circle' : 'save'}</span>
                        <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                      </>
                    )}
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg bg-[#1a1f28] border border-[#2a2f38] text-white hover:bg-[#1e2329] transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button className="px-4 py-2 rounded-lg bg-[#1a1f28] border border-[#2a2f38] text-white hover:bg-[#1e2329] transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">share</span>
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>

            {/* Edit Mode UI */}
            {isEditMode && (
              <div className="mb-6 p-6 rounded-xl border border-[#2a2f38] bg-[#1a1f28]/50">
                {/* Edit Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setEditTab('ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      editTab === 'ai'
                        ? 'bg-primary text-white'
                        : 'bg-[#141922] text-gray-400 hover:text-white'
                    }`}
                  >
                    AI Edit
                  </button>
                  <button
                    onClick={() => setEditTab('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      editTab === 'manual'
                        ? 'bg-primary text-white'
                        : 'bg-[#141922] text-gray-400 hover:text-white'
                    }`}
                  >
                    Manual Edit
                  </button>
                </div>

                {/* AI Edit Tab */}
                {editTab === 'ai' && (
                  <div>
                    <ChatSidebar
                      initialHistory={chatHistory}
                      onSendMessage={handleChatMessage}
                      isProcessing={isEditing}
                      embedded={true}
                    />
                  </div>
                )}

                {/* Manual Edit Tab */}
                {editTab === 'manual' && (
                  <div>
                    <div className="mb-2">
                      <textarea
                        value={manualEditJson}
                        onChange={(e) => setManualEditJson(e.target.value)}
                        className="w-full h-64 px-4 py-3 bg-[#141922] border border-[#2a2f38] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        placeholder="Edit the JSON data directly..."
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Edit the JSON structure directly. Make sure to maintain valid JSON format.
                      </p>
                      <button
                        onClick={handleManualEdit}
                        className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2 font-medium"
                      >
                        <Send className="w-4 h-4" />
                        Apply Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {result.type === 'network_graph' && (
              <DynamicNetworkGraph 
                data={result.data as NetworkGraphData} 
                onExpand={handleExpand}
              />
            )}
            {result.type === 'mind_map' && (
              <DynamicMindMap 
                data={result.data as MindMapData} 
                onExpand={handleExpand}
              />
            )}
            {result.type === 'tree_diagram' && (
              <DynamicTreeDiagram
                data={result.data as TreeDiagramData}
                onExpand={handleExpand}
              />
            )}
            {result.type === 'timeline' && (
              <DynamicTimeline
                data={result.data as TimelineData}
              />
            )}
            {result.type === 'gantt_chart' && (
              <DynamicGanttChart
                data={result.data as GanttChartData}
              />
            )}
            {result.type !== 'network_graph' && 
             result.type !== 'mind_map' && 
             result.type !== 'tree_diagram' && 
             result.type !== 'timeline' &&
             result.type !== 'gantt_chart' && (
              <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[500px] bg-[#1a1f28] rounded-xl border border-[#282e39]">
                <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">construction</span>
                <h3 className="text-xl font-bold text-white mb-2">{result.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Coming Soon</h3>
                <p className="text-gray-400 text-center max-w-md mb-4">
                  This visualization type is currently under development. Try using Network Graph or Mind Map for now.
                </p>
                <button
                  onClick={() => {
                    setResult(null);
                    setInput('');
                  }}
                  className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Try Another Visualization
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#141922] rounded-2xl border border-[#282e39] p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {autoSelect ? 'AI WILL SELECT THE BEST VISUALIZATION' : 'CHOOSE A VISUALIZATION TYPE (20)'}
              </h3>
              {autoSelect && (
                <span className="text-xs text-gray-500 italic">Disable AI Auto-Select to manually choose</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                // Category 1: Relationships & Networks
                { id: 'network_graph', icon: 'hub', label: 'Network Graph', desc: 'Concepts & relationships' },
                { id: 'mind_map', icon: 'account_tree', label: 'Mind Map', desc: 'Hierarchical ideas' },
                { id: 'tree_diagram', icon: 'device_hub', label: 'Tree Diagram', desc: 'Hierarchical structures' },
                // Category 2: Time & Sequence
                { id: 'timeline', icon: 'timeline', label: 'Timeline', desc: 'Events over time' },
                { id: 'gantt_chart', icon: 'view_timeline', label: 'Gantt Chart', desc: 'Project timeline' },
                { id: 'animated_timeline', icon: 'play_circle', label: 'Animated Timeline', desc: 'Step-by-step progression' },
                // Category 3: Processes & Flows
                { id: 'flowchart', icon: 'account_tree', label: 'Flowchart', desc: 'Process flows' },
                { id: 'sankey_diagram', icon: 'waterfall_chart', label: 'Sankey Diagram', desc: 'Flow magnitudes' },
                { id: 'swimlane_diagram', icon: 'table_chart', label: 'Swimlane Diagram', desc: 'Cross-functional flows' },
                // Category 4: Numerical Data
                { id: 'line_chart', icon: 'show_chart', label: 'Line Chart', desc: 'Trends over time' },
                { id: 'bar_chart', icon: 'bar_chart', label: 'Bar Chart', desc: 'Categorical comparisons' },
                { id: 'scatter_plot', icon: 'bubble_chart', label: 'Scatter Plot', desc: 'Correlations' },
                { id: 'heatmap', icon: 'blur_on', label: 'Heatmap', desc: 'Density patterns' },
                { id: 'radar_chart', icon: 'radar', label: 'Radar Chart', desc: 'Multi-dimensional' },
                { id: 'pie_chart', icon: 'pie_chart', label: 'Pie Chart', desc: 'Proportions' },
                // Category 5: Comparisons
                { id: 'comparison_table', icon: 'table_rows', label: 'Comparison Table', desc: 'Feature comparison' },
                { id: 'parallel_coordinates', icon: 'horizontal_split', label: 'Parallel Coordinates', desc: 'Multi-dimensional data' },
                // Category 6: Text & Content
                { id: 'word_cloud', icon: 'cloud', label: 'Word Cloud', desc: 'Text frequency' },
                { id: 'syntax_diagram', icon: 'code', label: 'Syntax Diagram', desc: 'Grammar rules' },
              ].map((item, idx) => {
                const isSelected = !autoSelect && selectedType === item.id;
                return (
                  <div
                    key={idx}
                    className={`bg-[#1a1f28] rounded-xl p-4 border transition-all flex flex-col items-center text-center gap-2 group ${
                      autoSelect
                        ? 'opacity-50 cursor-not-allowed border-[#2a2f38]'
                        : isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20'
                        : 'cursor-pointer border-[#2a2f38] hover:border-primary hover:-translate-y-1'
                    }`}
                    onClick={() => {
                      if (!autoSelect) {
                        setSelectedType(item.id);
                      }
                    }}
                  >
                    <div className="size-12 rounded-lg bg-gradient-to-tr from-primary/10 to-blue-600/10 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-2xl ${
                        autoSelect ? 'text-gray-600' : isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                      } transition-colors`}>
                        {item.icon}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${autoSelect ? 'text-gray-600' : isSelected ? 'text-primary' : 'text-gray-300'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
