'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useAuth } from '@clerk/nextjs';
import NetworkGraph from './components/NetworkGraph';
import MindMapVisualization from './components/MindMap';
import { generateVisualization, regenerateVisualization, saveVisualization } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData } from '@/lib/types/visualization';

export default function Home() {
  const { isSignedIn } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const visualizationRef = useRef<HTMLDivElement>(null);

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
      const data = await generateVisualization(input.trim());

      if (!data.success) {
        setError(data.error || 'Failed to generate visualization');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
      const title = input.substring(0, 100);
      const saveResult = await saveVisualization(title, result.type, result.data);

      if (!saveResult.success) {
        setError(saveResult.error || 'Failed to save visualization');
        return;
      }

      // Show success message (you can add a toast notification here)
      alert('Visualization saved successfully!');
    } catch (err) {
      setError('Failed to save visualization');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const handleFormatSwitch = async (newFormat: 'network_graph' | 'mind_map') => {
    if (!input || !result) return;

    setLoading(true);
    setError(null);

    try {
      const data = await regenerateVisualization(input.trim(), newFormat);

      if (!data.success) {
        setError(data.error || 'Failed to regenerate visualization');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('An error occurred while switching format.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = async () => {
    if (!visualizationRef.current) return;

    setExporting(true);

    try {
      const canvas = await html2canvas(visualizationRef.current, {
        backgroundColor: '#111827',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `visualization-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export image. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Sample prompts for testing
  const samplePrompts = [
    'Explain machine learning and its main branches',
    'Show me the structure of a modern web application',
    'Visualize the process of photosynthesis',
    'Create a knowledge map of project management methodologies',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 md:mb-4">
            Universal Visualization Engine
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-2">
            AI-powered platform for visualizing anything
          </p>
          <p className="text-gray-500 text-sm">
            Currently supporting 2 formats • Network Graphs & Mind Maps
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700/50 mb-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="input" className="block text-sm font-semibold text-gray-200 mb-3">
                What would you like to visualize?
              </label>
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Explain machine learning, Show me the solar system, Visualize a hiring process..."
                rows={5}
                className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none text-base"
                disabled={loading}
              />
            </div>

            {/* Sample Prompts */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 self-center font-medium">Quick start:</span>
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-all border border-gray-600/30 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/25 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Visualization ✨'
                )}
              </button>

              {(result || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold rounded-xl transition-all border border-gray-600/30 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-red-900/20 backdrop-blur-sm border border-red-500/50 text-red-200 px-6 py-5 rounded-xl mb-8 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-bold text-base">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visualization Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Controls Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-bold">
                        {result.type === 'network_graph' ? '🕸️ Network Graph' : '🧠 Mind Map'}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg text-xs font-medium">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Interactive
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.reason}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Format Switcher */}
                    <div className="flex gap-2 p-1.5 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <button
                        onClick={() => handleFormatSwitch('network_graph')}
                        disabled={result.type === 'network_graph' || loading}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                          result.type === 'network_graph'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Switch to Network Graph"
                      >
                        🕸️ Network
                      </button>
                      <button
                        onClick={() => handleFormatSwitch('mind_map')}
                        disabled={result.type === 'mind_map' || loading}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                          result.type === 'mind_map'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Switch to Mind Map"
                      >
                        🧠 Mind Map
                      </button>
                    </div>

                    {/* Save Button */}
                    {isSignedIn && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25"
                        title="Save Visualization"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save
                          </>
                        )}
                      </button>
                    )}

                    {/* Export Button */}
                    <button
                      onClick={handleExportPNG}
                      disabled={exporting}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/25"
                      title="Export as PNG"
                    >
                      {exporting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Export PNG
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              <div ref={visualizationRef}>
                {result.type === 'network_graph' && (
                  <NetworkGraph data={result.data as NetworkGraphData} />
                )}
                {result.type === 'mind_map' && (
                  <MindMapVisualization markdown={result.data as string} />
                )}
              </div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-900/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-100">
                    <p className="font-bold mb-2 text-base">💡 Interactive Tips</p>
                    <ul className="space-y-1.5 text-blue-200/90">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Drag to pan around the visualization
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Scroll or pinch to zoom in/out
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Hover over elements to see details
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Use the format switcher to try different views
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section - Only show when no visualization */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 mt-12"
          >
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🕸️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Network Graphs</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Visualize concepts, relationships, dependencies, and knowledge structures with
                interactive network graphs.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  Interactive nodes with smooth animations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  Pan, zoom, and drag functionality
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  Color-coded by category
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  Circular layout algorithm
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Mind Maps</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Organize ideas, brainstorm concepts, and create hierarchical structures with
                beautiful mind maps.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span>
                  Hierarchical tree structure
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span>
                  Expand/collapse branches
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span>
                  Depth-based color coding
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span>
                  Smooth animations
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
