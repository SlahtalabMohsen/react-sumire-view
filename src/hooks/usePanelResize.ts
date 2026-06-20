import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'player-split-ratio';
const DEFAULT_RATIO = 0.72;
const MIN_RATIO = 0.2;
const MAX_RATIO = 0.88;
const DIVIDER_HEIGHT = 6;

function clampRatio(v: number) {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, v));
}

export function usePanelResize() {
  const [ratio, setRatio] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const n = parseFloat(stored);
        if (!isNaN(n)) return clampRatio(n);
      }
    } catch { /* ignore */ }
    return DEFAULT_RATIO;
  });

  const dragging = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((r: number) => {
    try { localStorage.setItem(STORAGE_KEY, String(r)); } catch { /* ignore */ }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!wrapperRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const available = rect.height - DIVIDER_HEIGHT;
    const y = e.clientY - rect.top;
    const raw = y / available;
    setRatio(clampRatio(raw));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    persist(ratio);
  }, [ratio, persist]);

  useEffect(() => {
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        persist(ratio);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [ratio, persist]);

  return {
    wrapperRef,
    ratio,
    dividerHeight: DIVIDER_HEIGHT,
    onDividerPointerDown: onPointerDown,
    onDividerPointerMove: onPointerMove,
    onDividerPointerUp: onPointerUp,
  };
}
