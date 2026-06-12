"use client";

import { Rss, X } from 'lucide-react';
import type { LiveSheetData } from '@/lib/utils/live-sheet';

interface LiveSheetChipProps {
  sheet: LiveSheetData;
  onRemove: () => void;
}

export default function LiveSheetChip({ sheet, onRemove }: LiveSheetChipProps) {
  let host = sheet.url;
  try { host = new URL(sheet.url).hostname; } catch {}

  return (
    <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-surface-2 border border-edge max-w-full">
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-success/10 border border-success/20">
        <Rss size={12} className="text-success" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium text-ink-muted truncate max-w-[180px]">{host}</p>
        <p className="text-[10px] text-ink-faint">
          {sheet.rowCount.toLocaleString()} rows · {sheet.headers.length} cols
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Disconnect live sheet"
        className="w-5 h-5 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}
