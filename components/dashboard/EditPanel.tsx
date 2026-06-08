"use client";

import { useState } from 'react';
import ChatSidebar from '@/components/visualizations/ChatSidebar';
import ThemePanel from '@/components/dashboard/ThemePanel';
import { Send, Sparkles, Code2, Palette } from 'lucide-react';
import type { BrandTheme } from '@/lib/types/echarts-spec';

interface EditPanelProps {
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  handleChatMessage: (message: string) => Promise<void>;
  isEditing: boolean;
  manualEditJson: string;
  setManualEditJson: (json: string) => void;
  handleManualEdit: () => void;
  theme: BrandTheme;
  onThemeChange: (theme: BrandTheme) => void;
}

const EditPanel = ({
  chatHistory,
  handleChatMessage,
  isEditing,
  manualEditJson,
  setManualEditJson,
  handleManualEdit,
  theme,
  onThemeChange,
}: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'brand'>('ai');

  return (
    <div className="h-full w-full bg-surface-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1 px-4 h-12 shrink-0 border-b border-edge">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-accent/15 text-accent'
              : 'text-ink-faint hover:text-ink-muted hover:bg-surface-3'
          }`}
        >
          <Sparkles size={12} />
          AI Edit
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-accent/15 text-accent'
              : 'text-ink-faint hover:text-ink-muted hover:bg-surface-3'
          }`}
        >
          <Code2 size={12} />
          Manual
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'brand'
              ? 'bg-accent/15 text-accent'
              : 'text-ink-faint hover:text-ink-muted hover:bg-surface-3'
          }`}
        >
          <Palette size={12} />
          Brand
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ai' && (
          <ChatSidebar
            initialHistory={chatHistory}
            onSendMessage={async (message) => await handleChatMessage(message)}
            isProcessing={isEditing}
          />
        )}
        {activeTab === 'manual' && (
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={manualEditJson}
              onChange={(e) => setManualEditJson(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-surface-2 border border-edge rounded-xl text-ink font-mono text-xs focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 resize-none"
              placeholder="Edit the JSON data directly..."
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-faint">Edit the JSON structure directly.</p>
              <button
                onClick={handleManualEdit}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface-0 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                Apply
              </button>
            </div>
          </div>
        )}
        {activeTab === 'brand' && (
          <ThemePanel theme={theme} onChange={onThemeChange} />
        )}
      </div>
    </div>
  );
};

export default EditPanel;
