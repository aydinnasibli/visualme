"use client";

import { useState } from 'react';
import ChatSidebar from '@/components/visualizations/ChatSidebar';
import { Send } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-surface-dark border-l border-border-color p-4">
      <div className="flex flex-col h-full">
        <h2 className="text-xl font-bold text-white mb-4">Edit Visualization</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'ai'
                ? 'bg-primary text-white'
                : 'bg-surface-darker text-gray-400 hover:text-white'
            }`}
          >
            AI Edit
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'manual'
                ? 'bg-primary text-white'
                : 'bg-surface-darker text-gray-400 hover:text-white'
            }`}
          >
            Manual Edit
          </button>
        </div>
        {activeTab === 'ai' && (
          <div>
            <ChatSidebar
              initialHistory={chatHistory}
              onSendMessage={async (message) => await handleChatMessage(message)}
              isProcessing={isEditing}
              embedded={true}
            />
          </div>
        )}
        {activeTab === 'manual' && (
          <div>
            <div className="mb-2">
              <textarea
                value={manualEditJson}
                onChange={(e) => setManualEditJson(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-surface-darker border border-border-color rounded-lg text-white font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder="Edit the JSON data directly..."
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Edit the JSON structure directly.
              </p>
              <button
                onClick={handleManualEdit}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition flex items-center gap-2 font-medium"
              >
                <Send className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPanel;
