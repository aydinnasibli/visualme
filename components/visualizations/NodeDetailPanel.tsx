"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface NodeDetailPanelProps {
  selectedNode: {
    id: string;
    label: string;
    category: string;
    description?: string;
    color: string;
    degree?: number;
    extendable?: boolean;
    keyPoints?: string[];
    relatedConcepts?: string[];
  } | null;
  onClose: () => void;
  onExpand?: () => void;
  isExpanding?: boolean;
  readOnly?: boolean;
  isExtended?: boolean;
}

export default function NodeDetailPanel({
  selectedNode,
  onClose,
  onExpand,
  isExpanding = false,
  readOnly = false,
  isExtended = false,
}: NodeDetailPanelProps) {
  return (
    <AnimatePresence>
      {selectedNode && (
        <>
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -50, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-6 left-6 w-[340px] max-w-[calc(100%-3rem)] max-h-[calc(100%-3rem)] bg-zinc-900/95 border border-zinc-700/50 rounded-xl shadow-2xl pointer-events-auto z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header with gradient accent */}
            <div
              className="h-2 w-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${selectedNode.color}, ${selectedNode.color}88)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
              {/* Title & Close */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-white leading-tight pr-4 flex items-center gap-2">
                  {selectedNode.label}
                  {selectedNode.extendable && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                      style={{
                        borderColor: selectedNode.color,
                        color: selectedNode.color,
                        backgroundColor: `${selectedNode.color}15`,
                      }}
                    >
                      Extendable
                    </span>
                  )}
                </h2>
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                  style={{
                    borderColor: `${selectedNode.color}60`,
                    backgroundColor: `${selectedNode.color}20`,
                    color: selectedNode.color,
                  }}
                >
                  {selectedNode.category}
                </span>
                {selectedNode.degree !== undefined && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {selectedNode.degree}{" "}
                    {selectedNode.degree === 1 ? "Connection" : "Connections"}
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedNode.description && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Overview
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-sm">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {selectedNode.keyPoints && selectedNode.keyPoints.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {selectedNode.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-zinc-300"
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Concepts */}
              {selectedNode.relatedConcepts &&
                selectedNode.relatedConcepts.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Related Concepts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.relatedConcepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800 transition-all cursor-default"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Extend Button */}
              {selectedNode.extendable && onExpand && !readOnly && (
                isExtended ? (
                  <div
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      backgroundColor: `${selectedNode.color}15`,
                      borderWidth: "2px",
                      borderColor: `${selectedNode.color}60`,
                      color: selectedNode.color,
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Extended</span>
                  </div>
                ) : (
                  <button
                    onClick={onExpand}
                    disabled={isExpanding}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group"
                    style={{
                      backgroundColor: `${selectedNode.color}20`,
                      borderWidth: "2px",
                      borderColor: selectedNode.color,
                      color: selectedNode.color,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${selectedNode.color}30, transparent)`,
                        animation: "shimmer 2s infinite",
                      }}
                    />
                    {isExpanding ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
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
                        <span>Extending...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                        <span>Extend & Explore Deeper</span>
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </motion.div>

          <style jsx>{`
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(39, 39, 42, 0.5);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(113, 113, 122, 0.8);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(161, 161, 170, 0.9);
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
