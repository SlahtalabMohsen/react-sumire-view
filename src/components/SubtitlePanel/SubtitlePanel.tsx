import { useMemo, useCallback, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SubtitleCue, SubtitleTrack } from '../../types';
import { segmentJapanese } from '../../utils/segment';
import './SubtitlePanel.css';

interface SubtitlePanelProps {
  tracks: SubtitleTrack[];
  activeTrackIds: string[];
  currentTime: number;
  subtitleSize: number;
  subtitleFont: string;
  isFullscreen?: boolean;
  showFurigana?: boolean;
  onWordSave?: (word: string, sentence: string, timestamp: number) => void;
}

function renderFuriganaText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F]+)|([^\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F]+)/g;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      parts.push(
        <ruby key={key++} className="sv-ruby">
          {match[1]}
        </ruby>
      );
    } else {
      parts.push(match[2]);
    }
  }

  return parts.length > 0 ? parts : text;
}

export const SubtitlePanel = memo(function SubtitlePanel({
  tracks,
  activeTrackIds,
  currentTime,
  subtitleSize,
  subtitleFont,
  isFullscreen = false,
  showFurigana = false,
  onWordSave,
}: SubtitlePanelProps) {
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const activeCues = useMemo(() => {
    const allCues: SubtitleCue[][] = [];
    for (const trackId of activeTrackIds) {
      const track = tracks.find(t => t.id === trackId);
      if (!track) continue;
      const cues = track.cues.filter(
        cue => currentTime >= cue.startTime && currentTime <= cue.endTime
      );
      allCues.push(cues);
    }
    return allCues;
  }, [tracks, activeTrackIds, currentTime]);

  const hasContent = activeCues.some(cues => cues.length > 0);
  const fsMul = isFullscreen ? 1.3 : 1;

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0 && text.length <= 20 && onWordSave) {
        const sentence = (e.currentTarget as HTMLElement).textContent || '';
        onWordSave(text, sentence, currentTime);
        setSavedFlash(text);
        setTimeout(() => setSavedFlash(null), 800);
      }
    },
    [onWordSave, currentTime]
  );

  return (
    <div
      className={`subtitle-panel ${isFullscreen ? 'sv-fullscreen' : ''}`}
      style={{
        fontSize: `${subtitleSize * fsMul}px`,
        fontFamily: subtitleFont,
      }}
    >
      <AnimatePresence mode="wait">
        {hasContent ? (
          <motion.div
            key={activeCues.map(c => c.map(x => x.id).join(',')).join('|')}
            className="subtitle-content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {activeCues.map((cues, trackIdx) => {
              if (cues.length === 0) return null;
              const track = tracks.find(t => t.id === activeTrackIds[trackIdx]);
              return (
                <div key={activeTrackIds[trackIdx]} className="subtitle-track">
                  {track && tracks.length > 1 && (
                    <div className="subtitle-track-label">{track.label}</div>
                  )}
                  {cues.map(cue => {
                    const displayText = segmentJapanese(cue.text);
                    const isFlashing = savedFlash && cue.text.includes(savedFlash);
                    return (
                      <div
                        key={cue.id}
                        className={`subtitle-line ${isFlashing ? 'sv-word-flash' : ''}`}
                        onMouseUp={handleMouseUp}
                        style={{
                          fontWeight: cue.style?.bold ? 600 : undefined,
                          fontStyle: cue.style?.italic ? 'italic' : undefined,
                          fontSize: cue.style?.fontSize
                            ? `${cue.style.fontSize * (subtitleSize / 24) * fsMul}px`
                            : undefined,
                        }}
                      >
                        {showFurigana
                          ? renderFuriganaText(displayText)
                          : displayText}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="subtitle-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
