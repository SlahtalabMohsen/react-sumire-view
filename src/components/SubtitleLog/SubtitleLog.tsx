import { useMemo, useRef, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { SubtitleTrack } from '../../types';
import { formatTime } from '../../utils/time';
import { segmentJapanese } from '../../utils/segment';
import './SubtitleLog.css';

interface SubtitleLogProps {
  tracks: SubtitleTrack[];
  activeTrackIds: string[];
  currentTime: number;
  onSeek: (time: number) => void;
  showFurigana?: boolean;
}

export const SubtitleLog = memo(function SubtitleLog({
  tracks,
  activeTrackIds,
  currentTime,
  onSeek,
  showFurigana = false,
}: SubtitleLogProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allCues = useMemo(() => {
    const cues: { id: string; text: string; startTime: number; endTime: number; trackLabel: string }[] = [];
    for (const trackId of activeTrackIds) {
      const track = tracks.find(t => t.id === trackId);
      if (!track) continue;
      for (const cue of track.cues) {
        cues.push({
          id: cue.id,
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
          trackLabel: track.label,
        });
      }
    }
    return cues.sort((a, b) => a.startTime - b.startTime);
  }, [tracks, activeTrackIds]);

  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return allCues;
    const q = searchQuery.toLowerCase();
    return allCues.filter(c => c.text.toLowerCase().includes(q));
  }, [allCues, searchQuery]);

  const activeId = useMemo(() => {
    for (const cue of allCues) {
      if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
        return cue.id;
      }
    }
    return null;
  }, [allCues, currentTime]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="subtitle-log">
      <div className="log-search">
        <svg className="log-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="log-search-input"
          placeholder="Search dialogue..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search dialogue"
        />
      </div>

      <div className="log-list" ref={listRef}>
        {filteredCues.length === 0 ? (
          <div className="log-empty">
            {allCues.length === 0 ? 'No subtitles loaded' : 'No matches found'}
          </div>
        ) : (
          filteredCues.map(cue => {
            const isActive = cue.id === activeId;
            return (
              <motion.div
                key={cue.id}
                ref={isActive ? activeRef : undefined}
                className={`log-entry ${isActive ? 'active' : ''}`}
                onClick={() => onSeek(cue.startTime)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSeek(cue.startTime); } }}
                tabIndex={0}
                role="button"
                aria-label={`Jump to ${formatTime(cue.startTime)}: ${cue.text}`}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.1 }}
              >
                {isActive && (
                  <motion.div
                    className="log-active-bar"
                    layoutId="log-active"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="log-time">{formatTime(cue.startTime)}</span>
                <span className="log-text">
                  {showFurigana ? cue.text : segmentJapanese(cue.text)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
});
