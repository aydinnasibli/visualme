import { useCallback } from 'react';
import { exportVisualization, createShareLink } from '@/lib/actions/export';
import type { ThreadEntry } from '@/components/dashboard/VizThread';
import { toast } from 'sonner';

export interface UseVisualizationExportOptions {
  activeThread: ThreadEntry | null;
  setThreads: React.Dispatch<React.SetStateAction<ThreadEntry[]>>;
}

export function useVisualizationExport({ activeThread, setThreads }: UseVisualizationExportOptions) {
  const handleExportData = useCallback(async (format: 'json' | 'csv' | 'html') => {
    if (!activeThread?.vizId) { toast.error('Save the visualization first to export as ' + format.toUpperCase()); return; }
    try {
      const res = await exportVisualization(activeThread.vizId, format, { includeMetadata: true, title: activeThread.title });
      if (!res.success || !res.data) { toast.error(res.error || 'Export failed'); return; }
      const blob = new Blob([res.data.content], { type: res.data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  }, [activeThread]);

  const handleShare = useCallback(async () => {
    if (!activeThread?.vizId) { toast.error('Save the visualization first to share publicly'); return; }
    const id = activeThread.id;
    try {
      if (activeThread.isPublic && activeThread.shareId) {
        const url = `${window.location.origin}/share/${activeThread.shareId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Public link copied!');
        return;
      }
      const res = await createShareLink(activeThread.vizId, { isPublic: true });
      if (!res.success || !res.data) { toast.error(res.error || 'Failed to create share link'); return; }
      setThreads(p => p.map(t => t.id === id ? { ...t, isPublic: true, shareId: res.data!.shareId } : t));
      await navigator.clipboard.writeText(res.data.shareUrl);
      toast.success('Public link created and copied!');
    } catch { toast.error('Failed to share'); }
  }, [activeThread, setThreads]);

  return {
    handleExportData,
    handleShare,
  };
}
