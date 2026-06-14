"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rss, Link as LinkIcon, Loader2, Unlink, AlertCircle } from 'lucide-react';
import { detectLiveSheetColumns, type LiveSheetData } from '@/lib/utils/live-sheet';
import { useMounted } from '@/lib/hooks/useMounted';

interface LiveSheetButtonProps {
  liveSheet: LiveSheetData | null;
  onConnect: (data: LiveSheetData) => void;
  onDisconnect: () => void;
  disabled?: boolean;
}

export default function LiveSheetButton({ liveSheet, onConnect, onDisconnect, disabled }: LiveSheetButtonProps) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ left: number; bottom: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // The button sits inside a card with `overflow-hidden` (for its rounded
  // corners), which would clip an `absolute`-positioned dropdown anchored to
  // it. Render the dropdown into a portal instead, positioned from the
  // button's live screen coordinates so it floats above everything.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 6 });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const handleConnect = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/live-data?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to fetch data source');
        return;
      }
      onConnect({
        url,
        rawCsv: data.rawCsv,
        headers: data.headers,
        rowCount: data.rowCount,
        schema: data.schema ?? [],
        datasetColumns: detectLiveSheetColumns(data.rawCsv),
      });
      setUrlInput('');
      setOpen(false);
    } catch {
      setError('Failed to fetch data source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={liveSheet ? 'Live Google Sheet connected' : 'Connect a live Google Sheet or CSV link'}
        onClick={() => setOpen(p => !p)}
        disabled={disabled}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 ${
          liveSheet ? 'text-success bg-success/10 hover:bg-success/15' : 'text-ink-faint hover:text-ink hover:bg-surface-3'
        }`}
      >
        <Rss size={13} />
      </button>

      {mounted && coords && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              style={{ position: 'fixed', left: coords.left, bottom: coords.bottom }}
              className="w-72 rounded-xl z-50 bg-surface-2 border border-edge shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            >
              <div className="p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Rss size={12} className="text-success" />
                  <span className="text-xs font-semibold text-ink">Live Google Sheet</span>
                  {liveSheet && (
                    <span className="ml-auto text-[10px] font-medium text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Connected
                    </span>
                  )}
                </div>

                {liveSheet ? (
                  <>
                    <p className="text-[11px] text-ink-faint">
                      {liveSheet.rowCount.toLocaleString()} rows · {liveSheet.headers.length} columns
                    </p>
                    <button
                      type="button"
                      onClick={() => { onDisconnect(); setOpen(false); }}
                      className="flex items-center justify-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-edge text-danger hover:bg-surface-3 transition-colors"
                    >
                      <Unlink size={11} />
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-ink-faint flex items-center gap-1">
                        <LinkIcon size={9} /> Google Sheets or CSV URL
                      </label>
                      <input
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConnect(); } }}
                        placeholder="https://docs.google.com/spreadsheets/…"
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-surface-3 border border-edge text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>

                    {error && (
                      <p className="text-[10px] text-danger flex items-start gap-1">
                        <AlertCircle size={11} className="shrink-0 mt-px" />
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={!urlInput.trim() || loading}
                      className="flex items-center justify-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      {loading ? <Loader2 size={11} className="animate-spin" /> : <LinkIcon size={11} />}
                      {loading ? 'Connecting…' : 'Connect'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
