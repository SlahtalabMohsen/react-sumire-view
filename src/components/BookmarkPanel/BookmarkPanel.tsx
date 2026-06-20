import { useCallback, useState } from 'react';
import { formatTime } from '../../utils/time';
import type { Bookmark } from '../../types';
import './BookmarkPanel.css';

interface BookmarkPanelProps {
  bookmarks: Bookmark[];
  onAddBookmark: (bookmark: Bookmark) => void;
  onRemoveBookmark: (id: string) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  currentSubtitle?: string;
  onExportNotes: () => void;
}

export function BookmarkPanel({
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onSeek,
  currentTime,
  currentSubtitle,
  onExportNotes,
}: BookmarkPanelProps) {
  const [label, setLabel] = useState('');

  const handleAdd = useCallback(() => {
    const bookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      timestamp: currentTime,
      label: label || `Bookmark at ${formatTime(currentTime)}`,
      subtitleText: currentSubtitle,
      createdAt: Date.now(),
    };
    onAddBookmark(bookmark);
    setLabel('');
  }, [currentTime, label, currentSubtitle, onAddBookmark]);

  const sorted = [...bookmarks].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="bookmark-panel">
      <div className="bookmark-header">
        <h3>Bookmarks & Notes</h3>
        {bookmarks.length > 0 && (
          <button className="export-btn" onClick={onExportNotes}>
            📋 Export
          </button>
        )}
      </div>

      <div className="bookmark-add">
        <input
          type="text"
          className="bookmark-input"
          placeholder={`Add note at ${formatTime(currentTime)}...`}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="bookmark-add-btn" onClick={handleAdd}>
          + Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bookmark-empty">
          <p>No bookmarks yet</p>
          <p className="bookmark-empty-hint">
            Click "+ Add" to save a timestamp with a note
          </p>
        </div>
      ) : (
        <div className="bookmark-list">
          {sorted.map(bm => (
            <div key={bm.id} className="bookmark-item">
              <button
                className="bookmark-time"
                onClick={() => onSeek(bm.timestamp)}
              >
                {formatTime(bm.timestamp)}
              </button>
              <div className="bookmark-content">
                <div className="bookmark-label">{bm.label}</div>
                {bm.subtitleText && (
                  <div className="bookmark-subtitle">{bm.subtitleText}</div>
                )}
              </div>
              <button
                className="bookmark-remove"
                onClick={() => onRemoveBookmark(bm.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
