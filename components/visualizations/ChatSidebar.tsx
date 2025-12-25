"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date | string;
}

interface ChatSidebarProps {
  initialHistory?: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
  className?: string;
  embedded?: boolean;
}

export default function ChatSidebar({
  initialHistory = [],
  onSendMessage,
  isProcessing,
  className = "",
  embedded = false,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialHistory, isProcessing]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const baseClasses = embedded
    ? "flex flex-col h-[500px] bg-[#141922] border border-[#2a2f38] rounded-xl overflow-hidden"
    : "flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80 md:w-96 flex-shrink-0";

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* Header */}
      <div className={`p-4 border-b ${embedded ? 'border-[#2a2f38] bg-[#1a1f28]' : 'border-zinc-800 bg-zinc-900/50'} backdrop-blur flex items-center gap-2`}>
        <Bot className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-white">AI Copilot</h3>
        <span className="text-xs text-zinc-500 ml-auto flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      >
        {initialHistory.length === 0 ? (
          <div className="text-center text-zinc-500 mt-10 space-y-2">
            <Bot className="w-10 h-10 mx-auto opacity-50 mb-4" />
            <p className="text-sm">I'm your visualization assistant.</p>
            <p className="text-xs">Ask me to modify colors, add nodes, or restructure data.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => onSendMessage("Change the color scheme to blue")}
                className={`text-xs ${embedded ? 'bg-[#1a1f28] hover:bg-[#2a2f38]' : 'bg-zinc-800 hover:bg-zinc-700'} text-zinc-300 py-2 px-3 rounded-lg transition text-left`}
              >
                "Change color scheme to blue"
              </button>
              <button
                onClick={() => onSendMessage("Add a new node called 'Details'")}
                className={`text-xs ${embedded ? 'bg-[#1a1f28] hover:bg-[#2a2f38]' : 'bg-zinc-800 hover:bg-zinc-700'} text-zinc-300 py-2 px-3 rounded-lg transition text-left`}
              >
                "Add a new node called 'Details'"
              </button>
            </div>
          </div>
        ) : (
          initialHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-primary/20" : "bg-zinc-800"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : `${embedded ? 'bg-[#1a1f28] border-[#2a2f38]' : 'bg-zinc-800 border-zinc-700'} text-zinc-200 rounded-tl-none border`
                }`}
              >
                {msg.content}
                <div className="text-[10px] opacity-50 mt-1 flex justify-end items-center gap-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {/* Loading Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className={`${embedded ? 'bg-[#1a1f28] border-[#2a2f38]' : 'bg-zinc-800 border-zinc-700'} text-zinc-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm border flex items-center gap-2`}>
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 ${embedded ? 'bg-[#1a1f28] border-[#2a2f38]' : 'bg-zinc-900 border-zinc-800'} border-t`}>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            disabled={isProcessing}
            className={`w-full ${embedded ? 'bg-[#141922] border-[#2a2f38]' : 'bg-zinc-950 border-zinc-800'} text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed placeholder-zinc-500 text-sm border`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={`absolute right-2 top-2 p-1.5 ${embedded ? 'bg-primary' : 'bg-primary'} text-white rounded-lg hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          AI can make mistakes. Please check the results.
        </p>
      </div>
    </div>
  );
}
