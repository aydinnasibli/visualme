import React, { useState } from "react";
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Save, CheckCircle, Share2, Code, History, FolderOpen } from 'lucide-react';

interface SideActionsProps {
  handleSave: () => void;
  isSaved: boolean;
  saving: boolean;
  toggleEditPanel: () => void;
}

const SideActions = ({ handleSave, isSaved, saving, toggleEditPanel }: SideActionsProps) => {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-10 h-10 rounded-xl glass-panel flex items-center justify-center transition-all ${
            isSaved ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-stone-400 hover:text-white hover:bg-white/5'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSaved ? "Saved" : "Save Visualization"}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            isSaved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />
          )}
        </button>

        <button
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors tooltip"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors tooltip"
          title="Export Code"
        >
          <Code className="w-5 h-5" />
        </button>

        <div className="w-8 h-px bg-white/10 mx-auto my-1"></div>

        <button
          onClick={toggleEditPanel}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors tooltip"
          title="History & Chat"
        >
          <History className="w-5 h-5" />
        </button>

        <button
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 transition-colors tooltip"
          title="My Visualizations"
        >
            <a href="/my-visualizations">
                <FolderOpen className="w-5 h-5" />
            </a>
        </button>
    </div>
  );
};

export default SideActions;
