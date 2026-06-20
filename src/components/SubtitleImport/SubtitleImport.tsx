import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { parseSubtitleFile, detectFormat } from '../../parsers';
import type { SubtitleTrack } from '../../types';
import './SubtitleImport.css';

interface SubtitleImportProps {
  onImport: (track: SubtitleTrack) => void;
}

export function SubtitleImport({ onImport }: SubtitleImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const format = detectFormat(file.name);
      if (!format) {
        alert('Unsupported format. Please use SRT, VTT, or ASS files.');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        const label = file.name.replace(/\.[^.]+$/, '');
        const track = parseSubtitleFile(content, format, label, 'ja');
        if (track.cues.length === 0) {
          alert('No subtitle cues found in the file.');
          return;
        }
        onImport(track);
      };
      reader.readAsText(file);
    },
    [onImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <motion.div
      className={`subtitle-import ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      role="region"
      aria-label="Import subtitle file"
    >
      <div className="import-icon-wrap">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>
      </div>
      <p className="import-label">Import Subtitles</p>
      <p className="import-hint">SRT, VTT, or ASS</p>
      <button className="import-btn" onClick={() => fileInputRef.current?.click()}>
        Choose file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt,.vtt,.ass,.ssa"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        hidden
      />
    </motion.div>
  );
}
