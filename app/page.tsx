'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import NetworkGraph from './components/NetworkGraph';
import MindMapVisualization from './components/MindMap';
import { generateVisualization, regenerateVisualization } from '@/lib/actions/visualize';
import type { VisualizationResponse, NetworkGraphData } from '@/lib/types/visualization';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 md:mb-4">
            Universal Visualization Engine
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            AI-powered platform for visualizing anything
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Features 1 & 2: Network Graphs • Mind Maps
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-4 md:p-6 shadow-2xl border border-gray-700 mb-6 md:mb-8"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="input" className="block text-sm font-medium text-gray-300 mb-2">
                What would you like to visualize?
              </label>
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Explain machine learning, Show me the solar system, Visualize a hiring process..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-400 self-center">Try:</span>
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
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
                  'Generate Visualization'
                )}
              </button>

              {(result || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all shadow-lg"
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6 md:mb-8"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
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
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
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
              className="space-y-4"
            >
              {/* Controls Card */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                        {result.type === 'network_graph' ? '🕸️ Network Graph' : '🧠 Mind Map'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Interactive • Zoomable • Animated
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{result.reason}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Format Switch Buttons */}
                    <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
                      <button
                        onClick={() => handleFormatSwitch('network_graph')}
                        disabled={result.type === 'network_graph' || loading}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                          result.type === 'network_graph'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Switch to Network Graph"
                      >
                        🕸️ Network
                      </button>
                      <button
                        onClick={() => handleFormatSwitch('mind_map')}
                        disabled={result.type === 'mind_map' || loading}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                          result.type === 'mind_map'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Switch to Mind Map"
                      >
                        🧠 Mind Map
                      </button>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={handleExportPNG}
                      disabled={exporting}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
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
                  <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">Interactive Tips:</p>
                    <ul className="space-y-1 text-blue-300/80">
                      <li>• Drag to pan around the visualization</li>
                      <li>• Scroll or pinch to zoom in/out</li>
                      <li>• Hover over elements to see details</li>
                      <li>• Use the format switcher to try different views</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 mt-8 md:mt-12"
          >
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🕸️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Network Graphs</h3>
              <p className="text-gray-400 mb-3">
                Visualize concepts, relationships, dependencies, and knowledge structures with
                interactive network graphs.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>✓ Interactive nodes with animations</li>
                <li>✓ Pan, zoom, and drag functionality</li>
                <li>✓ Color-coded by category</li>
                <li>✓ Circular layout algorithm</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Mind Maps</h3>
              <p className="text-gray-400 mb-3">
                Organize ideas, brainstorm concepts, and create hierarchical structures with
                beautiful mind maps.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>✓ Hierarchical tree structure</li>
                <li>✓ Expand/collapse branches</li>
                <li>✓ Depth-based color coding</li>
                <li>✓ Smooth animations</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
