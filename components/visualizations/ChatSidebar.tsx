"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AttachmentChip from "@/components/dashboard/AttachmentChip";
import {
  readFileAttachment,
  composePromptWithAttachment,
  ATTACHMENT_ACCEPT,
  type FileAttachment,
} from "@/lib/utils/file-attachment";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date | string;
}

interface ChatSidebarProps {
  initialHistory?: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
}

const SUGGESTIONS = [
  "Add data labels showing the exact value on each data point",
  "Highlight the maximum value with a contrasting color",
  "Switch this to a line chart",
  "Add a second series for year-over-year comparison",
];

export default function ChatSidebar({
  initialHistory = [],
  onSendMessage,
  isProcessing,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialHistory, isProcessing]);

  const canAttach = !isProcessing && !attaching && !attachment;

  const attachFile = async (file: File) => {
    setAttaching(true);
    try {
      const { attachment: parsed, error } = await readFileAttachment(file);
      if (error) toast.error(error);
      else setAttachment(parsed!);
    } finally {
      setAttaching(false);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
    e.target.value = "";
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isProcessing) return;
    const message = composePromptWithAttachment(input, attachment);
    onSendMessage(message);
    setInput("");
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const send = (text: string) => onSendMessage(text);

  return (
    <div className="flex flex-col h-full bg-surface-1">
      {/* Header */}
      <div className="px-4 h-12 shrink-0 border-b border-edge flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-accent/10 border border-accent/20">
          <Bot size={13} className="text-accent" />
        </div>
        <h3 className="text-xs font-semibold text-ink-muted">AI Copilot</h3>
        <span className="text-[10px] text-ink-faint ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {initialHistory.length === 0 ? (
          <div className="text-center mt-8 space-y-1.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-accent/7 border border-accent/13">
              <Bot size={17} className="text-accent/50" />
            </div>
            <p className="text-xs font-medium text-ink-muted">I&apos;m your visualization assistant.</p>
            <p className="text-[11px] text-ink-faint">Ask me to restyle, restructure, or attach new data to refine this chart.</p>
            <div className="pt-4 flex flex-col gap-1.5 text-left">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] text-ink-muted py-2 px-3 rounded-lg text-left bg-surface-2 border border-edge hover:bg-surface-3 hover:text-ink transition-colors"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          initialHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                msg.role === "user"
                  ? "bg-accent/10 border-accent/20"
                  : "bg-surface-2 border-edge"
              }`}>
                {msg.role === "user"
                  ? <User size={12} className="text-accent" />
                  : <Bot size={12} className="text-ink-faint" />
                }
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed border ${
                msg.role === "user"
                  ? "bg-accent/12 border-accent/20 text-ink rounded-tr-sm"
                  : "bg-surface-2 border-edge text-ink-muted rounded-tl-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="text-[9px] text-ink-faint/70 mt-1 flex justify-end">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {isProcessing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface-2 border border-edge flex items-center justify-center shrink-0">
              <Bot size={12} className="text-ink-faint" />
            </div>
            <div className="bg-surface-2 border border-edge text-ink-faint rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[12px] flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </div>
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-edge shrink-0">
        <form
          onSubmit={handleSubmit}
          onDragOver={e => { e.preventDefault(); if (canAttach) setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => {
            e.preventDefault();
            setDragActive(false);
            if (!canAttach) return;
            const file = e.dataTransfer.files?.[0];
            if (file) attachFile(file);
          }}
          className={`rounded-xl overflow-hidden transition-all surface-control ${dragActive ? 'border-accent/50 bg-accent/5' : ''}`}
        >
          {attachment && (
            <div className="px-3 pt-3">
              <AttachmentChip attachment={attachment} onRemove={() => setAttachment(null)} />
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? "Add instructions for this data (optional)…" : "Ask the AI to refine this chart…"}
            disabled={isProcessing}
            className="w-full bg-transparent border-none focus:ring-0 text-ink placeholder:text-ink-faint text-[13px] px-3.5 pt-3 pb-1.5 outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-1.5 px-2 pb-2.5 pt-1">
            <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} onChange={handleFilePick} className="hidden" />
            <button
              type="button"
              title="Attach a data file (CSV, JSON, TXT)"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAttach}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
            >
              {attaching ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            </button>
            <div className="flex-1" />
            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isProcessing}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                (input.trim() || attachment) && !isProcessing
                  ? "bg-accent text-surface-0 hover:bg-accent-hover"
                  : "bg-surface-2 text-ink-faint"
              }`}
            >
              <Send size={13} />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-ink-faint/60 mt-2 text-center">
          AI can make mistakes. Please check the results.
        </p>
      </div>
    </div>
  );
}
