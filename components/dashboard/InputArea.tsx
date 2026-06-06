import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Globe, Lock, ArrowUp, ChevronDown, Check, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from '@clerk/nextjs';
import { getTokenBalance } from '@/lib/utils/tokens';
import { VIZ_TYPE_CONFIG } from '@/lib/constants/vizTypes';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  autoSelect: boolean;
  setAutoSelect: (value: boolean) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
  onOptions: () => void;
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
  isPublic,
  setIsPublic,
  onOptions,
}: InputAreaProps) => {
  const { user } = useUser();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    if (user) {
      getTokenBalance(user.id).then(balance => {
        setTokenBalance(balance.tokensRemaining);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!showTypeSelector) return;
    const close = (e: MouseEvent) => {
      if (!selectorRef.current?.contains(e.target as Node)) setShowTypeSelector(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showTypeSelector]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectedTypeInfo = VIZ_TYPE_CONFIG.find(t => t.id === selectedType);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
      <div className="relative">
        {/* Type Selector Popover */}
        <AnimatePresence>
          {showTypeSelector && (
            <motion.div
              ref={selectorRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-3 left-0 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 flex flex-col"
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Select Format</span>
                <button onClick={() => setShowTypeSelector(false)} className="text-zinc-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                <button
                  onClick={() => {
                    setAutoSelect(true);
                    setSelectedType(null);
                    setShowTypeSelector(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${autoSelect ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-300 hover:bg-white/5'}`}
                >
                  <Sparkles size={16} />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Auto-Detect</span>
                    <span className="text-[10px] opacity-70">AI chooses best format</span>
                  </div>
                  {autoSelect && <Check size={14} className="ml-auto" />}
                </button>

                <div className="h-px bg-white/5 my-1 mx-2" />

                {VIZ_TYPE_CONFIG.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setAutoSelect(false);
                      setSelectedType(type.id);
                      setShowTypeSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedType === type.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-300 hover:bg-white/5'}`}
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
          className={`relative group bg-slate-800/90 backdrop-blur-xl border transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl ${
            loading ? "border-indigo-500/50 shadow-indigo-500/20" : "border-white/10 focus-within:border-indigo-500/50 focus-within:shadow-lg hover:border-white/20"
          }`}
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent shimmer-effect pointer-events-none" />
          )}

          <div className="relative flex items-end p-3 gap-2">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to visualize..."
                className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 placeholder:text-zinc-500 resize-none py-3 px-2 max-h-48 text-base leading-relaxed"
                rows={1}
                disabled={loading}
              />

              {/* Bottom Controls */}
              <div className="flex items-center gap-2 px-2 pb-1 mt-1">
                <button
                  type="button"
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedType ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
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
                  onClick={onOptions}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  <Settings size={14} />
                  Options
                </button>

                <div className="flex-1" />

                <span className="text-[10px] text-zinc-500 font-mono">
                  {input.length}/10000
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pb-1">
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                  input.trim() && !loading
                    ? "bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 hover:shadow-indigo-500/25"
                    : "bg-slate-900 text-zinc-600 cursor-not-allowed border border-white/5"
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
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-medium">
          {/* Public/Private toggle */}
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            {isPublic ? (
              <Globe className="w-3 h-3 text-indigo-400" />
            ) : (
              <Lock className="w-3 h-3 text-zinc-400" />
            )}
            <span className={isPublic ? 'text-indigo-400' : 'text-zinc-400'}>
              {isPublic ? 'Public' : 'Private'}
            </span>
            {/* Toggle pill */}
            <div className={`relative w-7 h-4 rounded-full transition-colors ${isPublic ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${isPublic ? 'left-3.5' : 'left-0.5'}`} />
            </div>
          </button>

          <span className="flex items-center gap-1 text-indigo-400/70">
            <Sparkles className="w-3 h-3" />
            {tokenBalance !== null ? `${tokenBalance} tokens` : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
