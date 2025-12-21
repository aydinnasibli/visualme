'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVisualization } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData, MindMapData } from '@/lib/types/visualization';

const DynamicNetworkGraph = dynamic(() => import('@/app/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900/50 rounded-2xl flex items-center justify-center border border-gray-800 animate-pulse">
      <span className="text-gray-500 font-medium text-sm">Loading visualization...</span>
    </div>
  ),
});

const DynamicMindMap = dynamic(() => import('@/app/components/MindMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900/50 rounded-2xl flex items-center justify-center border border-gray-800 animate-pulse">
      <span className="text-gray-500 font-medium text-sm">Loading visualization...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'analyzing' | 'generating' | 'finalizing' | null>(null);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter some text to visualize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Analyzing & generating (combined in single AI call)
      setLoadingStep('analyzing');

      // After 200ms, show generating step (optimized for speed)
      const generatingTimer = setTimeout(() => setLoadingStep('generating'), 200);

      const data = await generateVisualization(input.trim());
      clearTimeout(generatingTimer);

      if (!data.success) {
        setError(data.error || 'Failed to generate visualization');
        return;
      }

      // Step 2: Finalizing
      setLoadingStep('finalizing');
      await new Promise(resolve => setTimeout(resolve, 150)); // Faster transition for snappier UX

      setResult(data);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  return (
    <>
      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-1/2 flex flex-col border-r border-[#1e2128] overflow-y-auto bg-[#141922]">
          <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-6">
            <header>
              <h2 className="text-xl font-bold mb-1 text-white">Input Data &amp; Prompts</h2>
              <p className="text-sm text-gray-400">
                Describe your story or upload raw data to begin.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between text-white">
                  Data Story Prompt
                  <button
                    type="button"
                    className="text-primary text-xs hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Improve with AI
                  </button>
                </label>
                <div className="relative group">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-40 bg-[#1a1f28] border border-[#2a2f38] rounded-xl p-4 text-sm text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed placeholder:text-gray-500"
                    placeholder="Example: Create a breakdown of quarterly sales by region for 2023, emphasizing the growth in the Asia-Pacific market..."
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-[#2a2f38] text-gray-500 transition-colors"
                      title="Voice Input"
                    >
                      <span className="material-symbols-outlined text-lg">mic</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Source Data</label>
                <div className="border-2 border-dashed border-[#2a2f38] rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[#1a1f28]/30 hover:bg-[#1a1f28] transition-colors cursor-pointer group">
                  <div className="size-10 rounded-full bg-[#2a2f38] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-gray-400">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">Click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">CSV, JSON, or Excel (Max 50MB)</p>
                  </div>
                </div>
              </div>

              <details className="group rounded-xl border border-[#2a2f38] bg-[#1a1f28] overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-[#1e2329] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400">tune</span>
                    <span className="text-sm font-medium text-white">Advanced Parameters</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 transition group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="p-4 pt-0 border-t border-[#2a2f38] mt-2">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1 block">
                        Color Scheme
                      </label>
                      <select className="w-full bg-[#0f1419] border border-[#2a2f38] rounded-lg text-sm p-2 text-gray-300">
                        <option>Modern Dark</option>
                        <option>Classic Light</option>
                        <option>Vibrant</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1 block">
                        Data Density
                      </label>
                      <select className="w-full bg-[#0f1419] border border-[#2a2f38] rounded-lg text-sm p-2 text-gray-300">
                        <option>Balanced</option>
                        <option>High</option>
                        <option>Simplified</option>
                      </select>
                    </div>
                  </div>
                </div>
              </details>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className="material-symbols-outlined">auto_fix_high</span>
                    Visualize This
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Visualization Output */}
        <div className="w-1/2 flex flex-col bg-[#0f1419] overflow-hidden relative">
          <div className="h-16 border-b border-[#1e2128] flex items-center justify-between px-6 bg-[#0f1419] shrink-0 z-10">
            <h2 className="font-bold text-white">Visualization Output</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                <span className="text-xs font-bold text-primary">AI Auto-Select</span>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={autoSelect}
                    onChange={(e) => setAutoSelect(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2a2f38] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#2a2f38] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex bg-[#1a1f28] rounded-lg p-1">
                <button className="p-1.5 rounded bg-[#2a2f38] shadow-sm text-primary">
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                </button>
                <button className="p-1.5 rounded text-gray-500 hover:text-white">
                  <span className="material-symbols-outlined text-sm">preview</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {result ? (
              <div className="h-full">
                {result.type === 'network_graph' && (
                  <DynamicNetworkGraph data={result.data as NetworkGraphData} />
                )}
                {result.type === 'mind_map' && (
                  <DynamicMindMap data={result.data as MindMapData} />
                )}
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                  RECOMMENDED BY AI
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="relative group cursor-pointer bg-[#141922] rounded-xl p-4 border-2 border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 transition-all hover:-translate-y-1">
                    <div className="absolute top-3 right-3">
                      <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                    </div>
                    <div className="aspect-video rounded-lg bg-gradient-to-tr from-primary/20 to-blue-600/20 mb-3 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-primary">
                        bar_chart
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">Grouped Bar Chart</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Best for comparing categories over time.
                    </p>
                  </div>

                  <div className="group cursor-pointer bg-[#141922] rounded-xl p-4 border border-[#2a2f38] hover:border-primary/50 transition-all hover:-translate-y-1">
                    <div className="aspect-video rounded-lg bg-[#1a1f28] mb-3 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-500 group-hover:text-primary transition-colors">
                        show_chart
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">Multi-Line Series</h4>
                    <p className="text-xs text-gray-400 mt-1">Ideal for trend analysis.</p>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                  ALL VISUALIZATIONS (19)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: 'pie_chart', label: 'Donut Chart' },
                    { icon: 'scatter_plot', label: 'Scatter Plot' },
                    { icon: 'hub', label: 'Network' },
                    { icon: 'bubble_chart', label: 'Bubble Chart' },
                    { icon: 'account_tree', label: 'Sankey' },
                    { icon: 'candlestick_chart', label: 'Candlestick' },
                    { icon: 'blur_on', label: 'Heatmap' },
                    { icon: 'forest', label: 'Tree Map' },
                    { icon: 'radar', label: 'Radar' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-[#141922] p-3 rounded-lg border border-[#2a2f38] hover:border-primary cursor-pointer transition-colors flex flex-col items-center text-center gap-2 group"
                    >
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">
                        {item.icon}
                      </span>
                      <span className="text-xs font-medium text-gray-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel - Recent Generations */}
      <div className="h-48 border-t border-[#1e2128] bg-[#0a0d11] flex flex-col shrink-0 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500 text-lg">history</span>
            <h3 className="text-sm font-bold text-white">Recent Generations</h3>
          </div>
          <button className="text-xs text-primary font-medium hover:underline">
            View All Library
          </button>
        </div>

        <div className="flex-1 overflow-x-auto px-6 pb-4 flex gap-4 items-center">
          {['Q3 Sales Projection', 'User Growth 2024', 'Market Share Analysis', 'Customer Sentiment'].map(
            (title, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 h-28 rounded-lg bg-[#141922] border border-[#2a2f38] relative group cursor-pointer overflow-hidden hover:border-primary/50 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-xs text-white font-medium truncate">{title}</p>
                  <p className="text-[10px] text-gray-400">
                    {i === 0 ? '2 mins ago' : i === 1 ? '1 hour ago' : 'Yesterday'}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
