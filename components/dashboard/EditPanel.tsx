"use client";

import { useState } from 'react';
import ChatSidebar from '@/components/visualizations/ChatSidebar';
import { Send, Sparkles, Code2 } from 'lucide-react';

interface EditPanelProps {
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  handleChatMessage: (message: string) => Promise<void>;
  isEditing: boolean;
  manualEditJson: string;
  setManualEditJson: (json: string) => void;
  handleManualEdit: () => void;
}

const EditPanel = ({
  chatHistory,
  handleChatMessage,
  isEditing,
  manualEditJson,
  setManualEditJson,
  handleManualEdit,
}: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1 px-4 h-12 shrink-0 border-b border-white/5">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-indigo-500/15 text-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          <Sparkles size={12} />
          AI Edit
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-indigo-500/15 text-indigo-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          <Code2 size={12} />
          Manual
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ai' && (
          <ChatSidebar
            initialHistory={chatHistory}
            onSendMessage={async (message) => await handleChatMessage(message)}
            isProcessing={isEditing}
            embedded={true}
          />
        )}
        {activeTab === 'manual' && (
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={manualEditJson}
              onChange={(e) => setManualEditJson(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-800 border border-white/8 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none"
              placeholder="Edit the JSON data directly..."
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600">Edit the JSON structure directly.</p>
              <button
                onClick={handleManualEdit}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPanel;
