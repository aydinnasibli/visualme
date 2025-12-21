'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { generateVisualization } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData, MindMapData } from '@/lib/types/visualization';

const DynamicNetworkGraph = dynamic(() => import('@/app/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1f28] rounded-2xl flex items-center justify-center border border-[#282e39] animate-pulse">
      <span className="text-gray-500 font-medium text-sm">Loading visualization...</span>
    </div>
  ),
});

const DynamicMindMap = dynamic(() => import('@/app/components/MindMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1f28] rounded-2xl flex items-center justify-center border border-[#282e39] animate-pulse">
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorScheme, setColorScheme] = useState('modern-dark');
  const [dataDensity, setDataDensity] = useState('balanced');

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
      setLoadingStep('analyzing');
      const generatingTimer = setTimeout(() => setLoadingStep('generating'), 200);

      const data = await generateVisualization(input.trim());
      clearTimeout(generatingTimer);

      if (!data.success) {
        setError(data.error || 'Failed to generate visualization');
        return;
      }

      setLoadingStep('finalizing');
      await new Promise(resolve => setTimeout(resolve, 150));

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
            <div className="min-h-[500px]">
              {result.type === 'network_graph' && (
                <DynamicNetworkGraph data={result.data as NetworkGraphData} />
              )}
              {result.type === 'mind_map' && (
                <DynamicMindMap data={result.data as MindMapData} />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#141922] rounded-2xl border border-[#282e39] p-8">
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                RECOMMENDED VISUALIZATIONS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: 'bar_chart', label: 'Bar Chart', desc: 'Compare categories' },
                  { icon: 'show_chart', label: 'Line Chart', desc: 'Show trends' },
                  { icon: 'pie_chart', label: 'Pie Chart', desc: 'Show proportions' },
                  { icon: 'scatter_plot', label: 'Scatter Plot', desc: 'Find correlations' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`group cursor-pointer bg-[#1a1f28] rounded-xl p-5 border transition-all hover:-translate-y-1 ${
                      idx === 0
                        ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                        : 'border-[#2a2f38] hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-tr from-primary/20 to-blue-600/20 mb-3 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-4xl ${idx === 0 ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}>
                        {item.icon}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{item.label}</h4>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#282e39] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                ALL VISUALIZATIONS (19)
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
                {[
                  { icon: 'donut_small', label: 'Donut' },
                  { icon: 'hub', label: 'Network' },
                  { icon: 'bubble_chart', label: 'Bubble' },
                  { icon: 'account_tree', label: 'Sankey' },
                  { icon: 'candlestick_chart', label: 'Candlestick' },
                  { icon: 'blur_on', label: 'Heatmap' },
                  { icon: 'forest', label: 'Treemap' },
                  { icon: 'radar', label: 'Radar' },
                  { icon: 'waterfall_chart', label: 'Waterfall' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#1a1f28] p-3 rounded-lg border border-[#2a2f38] hover:border-primary cursor-pointer transition-all flex flex-col items-center text-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-2xl text-gray-400 group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
