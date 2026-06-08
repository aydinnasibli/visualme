"use client";

import { FileSpreadsheet, FileJson, FileText, X } from 'lucide-react';
import { formatFileSize, type FileAttachment } from '@/lib/utils/file-attachment';

const EXTENSION_ICONS: Record<FileAttachment['extension'], React.ElementType> = {
  csv: FileSpreadsheet,
  json: FileJson,
  txt: FileText,
};

interface AttachmentChipProps {
  attachment: FileAttachment;
  onRemove: () => void;
}

export default function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const Icon = EXTENSION_ICONS[attachment.extension];

  return (
    <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-surface-2 border border-edge max-w-full">
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
        <Icon size={12} className="text-accent" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium text-ink-muted truncate max-w-[180px]">{attachment.name}</p>
        <p className="text-[10px] text-ink-faint">
          {formatFileSize(attachment.size)}
          {attachment.rowCount !== undefined ? ` · ${attachment.rowCount.toLocaleString()} rows` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Remove attachment"
        className="w-5 h-5 rounded-md flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
      >
        <X size={11} />
      </button>
    </div>
  );
}
