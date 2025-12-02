'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NetworkGraph from './components/NetworkGraph';
import MindMapVisualization from './components/MindMap';
import type { VisualizationResponse, NetworkGraphData } from '@/lib/types/visualization';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data: VisualizationResponse = await response.json();

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

  // Sample prompts for testing
  const samplePrompts = [
    'Explain machine learning and its main branches',
    'Show me the structure of a modern web application',
    'Visualize the process of photosynthesis',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Universal Visualization Engine
          </h1>
          <p className="text-gray-400 text-lg">
            AI-powered platform for visualizing anything
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 mb-8"
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <span className="text-sm text-gray-400">Try:</span>
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
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
              className="bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-8"
            >
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
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
              {/* Info Card */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-2">
                      {result.type === 'network_graph' ? 'Network Graph' : 'Mind Map'}
                    </span>
                    <p className="text-gray-400 text-sm">{result.reason}</p>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              {result.type === 'network_graph' && (
                <NetworkGraph data={result.data as NetworkGraphData} />
              )}
              {result.type === 'mind_map' && (
                <MindMapVisualization markdown={result.data as string} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 mt-12"
          >
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Network Graphs</h3>
              <p className="text-gray-400">
                Visualize concepts, relationships, dependencies, and knowledge structures with
                interactive network graphs.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Mind Maps</h3>
              <p className="text-gray-400">
                Organize ideas, brainstorm concepts, and create hierarchical structures with
                beautiful mind maps.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
