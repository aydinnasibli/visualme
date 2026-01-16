import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Globe, Lock, ArrowUp, UploadCloud, ChevronDown, Check, Settings, Network, Share2, Binary, GitFork, Calendar, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from '@clerk/nextjs';
import { getTokenBalance } from '@/lib/utils/tokens';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  autoSelect: boolean;
  setAutoSelect: (value: boolean) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
}

const InputArea = ({
  input,
  setInput,
  handleSubmit,
  loading,
  autoSelect,
  setAutoSelect,
  selectedType,
  setSelectedType,
}: InputAreaProps) => {
  const { user } = useUser();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Fetch token balance
  useEffect(() => {
    if (user) {
       getTokenBalance(user.id).then(balance => {
           setTokenBalance(balance.tokensRemaining);
       });
    }
  }, [user, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const visualizationTypes = [
    { id: 'network_graph', name: 'Network Graph', icon: Network },
    { id: 'mind_map', name: 'Mind Map', icon: Share2 },
    { id: 'tree_diagram', name: 'Tree Diagram', icon: Binary },
    { id: 'flowchart', name: 'Flowchart', icon: GitFork },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'gantt_chart', name: 'Gantt Chart', icon: Calendar },
    { id: 'sankey_diagram', name: 'Sankey Diagram', icon: GitFork },
    { id: 'bar_chart', name: 'Bar Chart', icon: BarChart2 },
  ];

  const selectedTypeInfo = visualizationTypes.find(t => t.id === selectedType);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
      <div className="relative">
        {/* Type Selector Popover */}
        <AnimatePresence>
            {showTypeSelector && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full mb-3 left-0 w-64 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 flex flex-col"
                >
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-400">Select Format</span>
                        <button onClick={() => setShowTypeSelector(false)} className="text-stone-500 hover:text-white"><X size={14} /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        <button
                            onClick={() => {
                                setAutoSelect(true);
                                setSelectedType(null);
                                setShowTypeSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${autoSelect ? 'bg-primary/20 text-primary' : 'text-stone-300 hover:bg-white/5'}`}
                        >
                            <Sparkles size={16} />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Auto-Detect</span>
                                <span className="text-[10px] opacity-70">AI chooses best format</span>
                            </div>
                            {autoSelect && <Check size={14} className="ml-auto" />}
                        </button>

                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                        {visualizationTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setAutoSelect(false);
                                    setSelectedType(type.id);
                                    setShowTypeSelector(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedType === type.id ? 'bg-primary/20 text-primary' : 'text-stone-300 hover:bg-white/5'}`}
                            >
                                <type.icon size={16} />
                                <span className="font-medium">{type.name}</span>
                                {selectedType === type.id && <Check size={14} className="ml-auto" />}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <form
          onSubmit={handleSubmit}
          className={`relative group bg-surface-dark/90 backdrop-blur-xl border transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl ${
            loading ? "border-primary/50 shadow-primary/20" : "border-white/10 focus-within:border-primary/50 focus-within:shadow-lg hover:border-white/20"
          }`}
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent shimmer-effect pointer-events-none" />
          )}

          <div className="relative flex items-end p-3 gap-2">
            <div className="flex-1 min-w-0">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to visualize..."
                    className="w-full bg-transparent border-none focus:ring-0 text-stone-200 placeholder:text-stone-500 resize-none py-3 px-2 max-h-48 text-base leading-relaxed"
                    rows={1}
                    disabled={loading}
                />

                {/* Bottom Controls */}
                <div className="flex items-center gap-2 px-2 pb-1 mt-1">
                    <button
                        type="button"
                        onClick={() => setShowTypeSelector(!showTypeSelector)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedType ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
                        }`}
                    >
                        {selectedType && selectedTypeInfo ? (
                            <>
                                <selectedTypeInfo.icon size={14} />
                                {selectedTypeInfo.name}
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} />
                                Auto Format
                            </>
                        )}
                        <ChevronDown size={14} />
                    </button>

                     <button
                        type="button"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
                    >
                        <Settings size={14} />
                        Options
                    </button>

                    <div className="flex-1"></div>

                    <span className="text-[10px] text-stone-500 font-mono">
                         {input.length}/2000
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 pb-1">
                 {/* Upload Button (Placeholder) */}
                 {/* <button
                    type="button"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="Upload file"
                 >
                    <UploadCloud size={20} />
                 </button> */}

                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                    input.trim() && !loading
                        ? "bg-primary text-white hover:bg-primary-hover hover:scale-105 hover:shadow-primary/25"
                        : "bg-surface-darker text-stone-600 cursor-not-allowed border border-white/5"
                    }`}
                >
                    {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                    <ArrowUp size={20} />
                    )}
                </button>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-stone-500 font-medium">
            <span className="flex items-center gap-1">
               <Globe className="w-3 h-3" /> Public
            </span>
            <span className="flex items-center gap-1">
               <Lock className="w-3 h-3" /> Private
            </span>
             <span className="flex items-center gap-1 text-primary/70">
               <Sparkles className="w-3 h-3" /> {tokenBalance !== null ? `${tokenBalance} tokens` : 'Loading...'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
