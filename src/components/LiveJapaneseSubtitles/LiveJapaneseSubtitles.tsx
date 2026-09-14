import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WHISPER_MODELS,
  type WhisperStatus,
  type WhisperDevice,
} from '../../workers/whisperProtocol';
import type { WhisperSettings } from '../../hooks/useWhisper';
import './LiveJapaneseSubtitles.css';

interface LiveJapaneseSubtitlesProps {
  status: WhisperStatus;
  progress: number;
  device: WhisperDevice | null;
  settings: WhisperSettings;
  errorMessage: string | null;
  transcribedCount: number;
  onUpdateSettings: (updates: Partial<WhisperSettings>) => void;
  onStart: () => void;
  onStop: () => void;
  onExportSRT: () => void;
  onExportTXT: () => void;
  onClear: () => void;
}

const STATUS_LABELS: Record<WhisperStatus, string> = {
  idle: '停止中 · Off',
  loading: 'モデル読み込み中 · Loading model…',
  listening: '録音中 · Listening',
  transcribing: '文字起こし中 · Transcribing…',
  ready: '準備完了 · Ready (paused)',
  error: 'エラー · Error',
};

const CHUNK_DURATIONS = [5, 10, 15, 30];

export const LiveJapaneseSubtitles = memo(function LiveJapaneseSubtitles({
  status,
  progress,
  device,
  settings,
  errorMessage,
  transcribedCount,
  onUpdateSettings,
  onStart,
  onStop,
  onExportSRT,
  onExportTXT,
  onClear,
}: LiveJapaneseSubtitlesProps) {
  const isActive = status !== 'idle';
  const isBusy = status === 'loading' || status === 'listening' || status === 'transcribing' || status === 'ready';
  const isRunning = status === 'listening' || status === 'transcribing';

  return (
    <div className="ljs-section">
      <div className="ljs-header">
        <div className="ljs-title-row">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span className="ljs-title">Live Japanese Subtitles</span>
        </div>
        {device && (
          <span
            className={`ljs-device-badge ${device === 'webgpu' ? 'gpu' : 'wasm'}`}
            title={device === 'webgpu' ? 'Inference runs on WebGPU' : 'Inference runs on WebAssembly (CPU)'}
          >
            {device === 'webgpu' ? 'WebGPU' : 'WASM'}
          </span>
        )}
      </div>

      <p className="ljs-hint">リアルタイム日本語字幕 — ブラウザ内 Whisper 音声認識</p>

      <div className="ljs-controls">
        {!isRunning ? (
          <button
            className="ljs-btn primary"
            onClick={onStart}
            disabled={status === 'loading'}
            aria-label="Start live Japanese transcription"
          >
            {status === 'loading' ? '読み込み中…' : '▶ 開始 Start'}
          </button>
        ) : (
          <button
            className="ljs-btn danger"
            onClick={onStop}
            aria-label="Stop live Japanese transcription"
          >
            ■ 停止 Stop
          </button>
        )}

        <button
          className="ljs-btn"
          onClick={onExportSRT}
          disabled={transcribedCount === 0}
          title="Export generated subtitles as a .srt file"
        >
          SRT
        </button>
        <button
          className="ljs-btn"
          onClick={onExportTXT}
          disabled={transcribedCount === 0}
          title="Export generated subtitles as plain text"
        >
          TXT
        </button>
        {transcribedCount > 0 && (
          <button
            className="ljs-btn ghost"
            onClick={onClear}
            title="Clear generated subtitles"
          >
            Clear
          </button>
        )}
      </div>

      <div className="ljs-setting-row">
        <span>Model</span>
        <select
          className="ljs-select"
          value={settings.modelId}
          onChange={e => onUpdateSettings({ modelId: e.target.value })}
          disabled={isRunning}
          title="Larger models are more accurate but slower"
        >
          {WHISPER_MODELS.map(model => (
            <option key={model.id} value={model.id}>
              {model.label} ({model.size})
            </option>
          ))}
        </select>
      </div>

      <div className="ljs-setting-row">
        <span>Chunk</span>
        <div className="ljs-pills">
          {CHUNK_DURATIONS.map(d => (
            <button
              key={d}
              className={`ljs-pill ${settings.chunkDuration === d ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ chunkDuration: d })}
              disabled={isRunning}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {(isActive || transcribedCount > 0) && (
          <motion.div
            className="ljs-status-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="ljs-status-row">
              <motion.div
                className="ljs-dot"
                style={{
                  background:
                    status === 'error'
                      ? '#ef4444'
                      : status === 'listening'
                        ? 'var(--accent)'
                        : status === 'transcribing' || status === 'loading'
                          ? '#f59e0b'
                          : status === 'ready'
                            ? '#22c55e'
                            : 'var(--text-muted)',
                }}
                animate={isBusy ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                transition={
                  isBusy ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}
                }
              />
              <span className="ljs-status-text">{STATUS_LABELS[status]}</span>
              {transcribedCount > 0 && (
                <span className="ljs-count">{transcribedCount} cues</span>
              )}
            </div>

            {status === 'loading' && (
              <div className="ljs-progress">
                <div className="ljs-progress-track">
                  <div className="ljs-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="ljs-progress-label">
                  {progress < 100 ? `Downloading model… ${progress}%` : 'Initialising…'}
                </span>
              </div>
            )}

            {errorMessage && <div className="ljs-error">{errorMessage}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="ljs-note">
        100% in your browser — audio never leaves your device. The Whisper model
        downloads once and is cached locally for offline use.
      </p>
    </div>
  );
});
