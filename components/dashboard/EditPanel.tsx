"use client";

import { useState } from 'react';
import ChatSidebar from '@/components/visualizations/ChatSidebar';
import ThemePanel from '@/components/dashboard/ThemePanel';
import { Sparkles, Palette } from 'lucide-react';
import type { BrandTheme } from '@/lib/types/echarts-spec';

interface EditPanelProps {
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date | string }>;
  handleChatMessage: (message: string) => Promise<void>;
  isEditing: boolean;
  theme: BrandTheme;
  onThemeChange: (theme: BrandTheme) => void;
}

const EditPanel = ({
  chatHistory,
  handleChatMessage,
  isEditing,
  theme,
  onThemeChange,
}: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'brand'>('ai');

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
        {activeTab === 'brand' && (
          <ThemePanel theme={theme} onChange={onThemeChange} />
        )}
      </div>
    </div>
  );
};

export default EditPanel;
