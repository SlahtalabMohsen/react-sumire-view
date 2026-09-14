import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SubtitleCue } from '../types';
import { AudioCapture } from '../transcription/audioCapture';
import {
  WHISPER_MODELS,
  DEFAULT_WHISPER_MODEL,
  type WhisperStatus,
  type WhisperDevice,
  type WhisperWorkerRequest,
  type WhisperWorkerResponse,
} from '../workers/whisperProtocol';
import { generateSRT, generateTXT, downloadTextFile, sanitizeFileName } from '../utils/srtGenerator';

const SETTINGS_STORAGE = 'sumire-view:whisper-settings';
/** Max cues kept in memory (older ones are dropped). */
const MAX_CUES = 4000;
/** Max audio length merged into a single inference call. */
const MAX_BATCH_SECONDS = 120;
/** Interval used to poll the capture buffer. */
const TICK_MS = 500;

export interface WhisperSettings {
  modelId: string;
  /** Seconds of audio accumulated before a transcription is scheduled. */
  chunkDuration: number;
}

export interface UseWhisperOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoFileName?: string;
  onTrackUpdate: (trackId: string, cues: SubtitleCue[], source: 'whisper') => void;
}

export interface UseWhisperResult {
  status: WhisperStatus;
  /** Model download / load progress, 0–100. */
  progress: number;
  device: WhisperDevice | null;
  settings: WhisperSettings;
  errorMessage: string | null;
  transcribedCount: number;
  updateSettings: (updates: Partial<WhisperSettings>) => void;
  start: () => Promise<void>;
  stop: () => void;
  exportSRT: () => void;
  exportTXT: () => void;
  clearCues: () => void;
}

interface PendingChunk {
  audio: Float32Array;
  sampleRate: number;
  /** Presentation time of the first sample. */
  offset: number;
  /** Whether this chunk continues the previous one seamlessly. */
  contiguous: boolean;
}

function loadSettings(): WhisperSettings {
  const defaults: WhisperSettings = {
    modelId: DEFAULT_WHISPER_MODEL,
    chunkDuration: 10,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WhisperSettings>;
    const modelId =
      parsed.modelId && WHISPER_MODELS.some(m => m.id === parsed.modelId)
        ? parsed.modelId
        : defaults.modelId;
    const chunkDuration =
      typeof parsed.chunkDuration === 'number' && parsed.chunkDuration >= 3 && parsed.chunkDuration <= 30
        ? parsed.chunkDuration
        : defaults.chunkDuration;
    return { modelId, chunkDuration };
  } catch {
    return defaults;
  }
}

function saveSettings(settings: WhisperSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
  } catch {
    // ignore storage failures
  }
}

let globalCueId = 0;
function nextCueId(): string {
  return `whisper-${Date.now()}-${++globalCueId}`;
}

export function useWhisper({
  videoRef,
  videoFileName,
  onTrackUpdate,
}: UseWhisperOptions): UseWhisperResult {
  const [settings, setSettings] = useState<WhisperSettings>(loadSettings);
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [device, setDevice] = useState<WhisperDevice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcribedCount, setTranscribedCount] = useState(0);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const workerRef = useRef<Worker | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cuesRef = useRef<SubtitleCue[]>([]);
  const pendingRef = useRef<PendingChunk[]>([]);
  const isActiveRef = useRef(false);
  const isBusyRef = useRef(false);
  const chunkStartRef = useRef(0);
  const seekedSinceLastChunkRef = useRef(true);
  const trackId = useId();
  const lastCueRef = useRef<SubtitleCue | null>(null);

  const baseName = useMemo(() => {
    return sanitizeFileName((videoFileName ?? 'sumire-view').replace(/\.[^.]+$/, ''));
  }, [videoFileName]);

  const updateSettings = useCallback((updates: Partial<WhisperSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  /** Pushes generated cues onto the whisper track (deduping repeats). */
  const addSegments = useCallback(
    (segments: { start: number; end: number; text: string }[], offset: number) => {
      if (segments.length === 0) return;
      const cues = cuesRef.current;
      let added = false;

      for (const segment of segments) {
        const text = segment.text.trim();
        if (!text) continue;

        const start = offset + segment.start;
        const end = offset + Math.max(segment.end, segment.start + 0.2);

        // Drop near-duplicate repetition across chunk boundaries.
        const last = lastCueRef.current;
        if (last && last.text === text && Math.abs(last.startTime - start) < 1) {
          continue;
        }

        const cue: SubtitleCue = {
          id: nextCueId(),
          startTime: start,
          endTime: end,
          text,
          source: 'whisper',
        };
        cues.push(cue);
        lastCueRef.current = cue;
        added = true;
      }

      if (!added) return;

      // Bound memory usage by dropping the oldest cues.
      if (cues.length > MAX_CUES) {
        cuesRef.current = cues.slice(cues.length - MAX_CUES);
      }
      setTranscribedCount(cuesRef.current.length);
      onTrackUpdate(trackId, cuesRef.current, 'whisper');
    },
    [onTrackUpdate, trackId]
  );

  /** Sends the next batch of pending audio to the worker (contiguous runs only). */
  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    if (isBusyRef.current || pending.length === 0 || !workerRef.current) return;

    // Group the head of the queue into a contiguous run, capped so a single
    // inference call cannot grow unboundedly behind realtime playback.
    const batch: PendingChunk[] = [pending[0]];
    let batchSeconds = pending[0].audio.length / pending[0].sampleRate;
    for (let i = 1; i < pending.length; i++) {
      if (!pending[i].contiguous) break;
      const seconds = pending[i].audio.length / pending[i].sampleRate;
      if (batchSeconds + seconds > MAX_BATCH_SECONDS) break;
      batch.push(pending[i]);
      batchSeconds += seconds;
    }

    pendingRef.current = pending.slice(batch.length);

    let totalLength = 0;
    for (const chunk of batch) totalLength += chunk.audio.length;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of batch) {
      merged.set(chunk.audio, offset);
      offset += chunk.audio.length;
    }

    isBusyRef.current = true;
    const request: WhisperWorkerRequest = {
      type: 'transcribe',
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      audio: merged,
      sampleRate: batch[0].sampleRate,
      offset: batch[0].offset,
      // Japanese transcription only — never translation.
      language: 'ja',
      task: 'transcribe',
    };
    workerRef.current.postMessage(request, [merged.buffer]);
  }, []);

  /** Collects the buffered audio into the pending queue. */
  const collectChunk = useCallback(() => {
    const video = videoRef.current;
    const capture = captureRef.current;
    if (!video || !capture || !isActiveRef.current) return;
    if (video.paused) return;
    if (capture.bufferedSeconds < settingsRef.current.chunkDuration) return;

    const chunk = capture.collectChunk();
    if (!chunk || chunk.audio.length === 0) return;

    pendingRef.current.push({
      ...chunk,
      offset: chunkStartRef.current,
      contiguous: !seekedSinceLastChunkRef.current,
    });
    seekedSinceLastChunkRef.current = false;
    chunkStartRef.current = video.currentTime;
    flushPending();
  }, [videoRef, flushPending]);

  const handleWorkerMessage = useCallback(
    (event: MessageEvent<WhisperWorkerResponse>) => {
      const message = event.data;
      switch (message.type) {
        case 'progress':
          setProgress(Math.round(message.progress));
          break;
        case 'ready':
          if (!isActiveRef.current) return;
          setDevice(message.device);
          setProgress(100);
          setErrorMessage(null);
          setStatus(videoRef.current?.paused === false ? 'listening' : 'ready');
          // In case audio accumulated while the model was loading.
          flushPending();
          break;
        case 'result':
          isBusyRef.current = false;
          if (!isActiveRef.current) return;
          addSegments(message.segments, message.offset);
          setStatus(videoRef.current?.paused === false ? 'listening' : 'ready');
          flushPending();
          break;
        case 'status':
          if (message.status === 'transcribing' && isActiveRef.current) {
            setStatus('transcribing');
          }
          break;
        case 'error':
          isBusyRef.current = false;
          setErrorMessage(message.message);
          setStatus('error');
          break;
      }
    },
    [videoRef, addSegments, flushPending]
  );

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    const capture = captureRef.current;
    if (!isActiveRef.current || !video) return;
    // Audio around the discontinuity is unusable; drop it and realign.
    capture?.clearBuffer();
    seekedSinceLastChunkRef.current = true;
    chunkStartRef.current = video.currentTime;
  }, [videoRef]);

  const handlePause = useCallback(() => {
    if (!isActiveRef.current) return;
    // Flush whatever has been captured so subtitles appear promptly after pausing.
    const capture = captureRef.current;
    if (capture && capture.bufferedSeconds >= 1) {
      const video = videoRef.current;
      const chunk = capture.collectChunk();
      if (chunk && chunk.audio.length && video) {
        pendingRef.current.push({
          ...chunk,
          offset: chunkStartRef.current,
          contiguous: !seekedSinceLastChunkRef.current,
        });
        seekedSinceLastChunkRef.current = false;
        chunkStartRef.current = video.currentTime;
        flushPending();
      }
    }
    setStatus(prev => (prev === 'error' ? prev : 'ready'));
  }, [videoRef, flushPending]);

  const handlePlay = useCallback(() => {
    if (!isActiveRef.current) return;
    setStatus(prev => (prev === 'error' ? prev : 'listening'));
  }, []);

  const teardown = useCallback(() => {
    isActiveRef.current = false;
    isBusyRef.current = false;
    pendingRef.current = [];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    }
    if (captureRef.current) {
      captureRef.current.destroy();
      captureRef.current = null;
    }
  }, [videoRef, handleSeeked, handlePause, handlePlay]);

  const start = useCallback(async () => {
    if (isActiveRef.current) return;

    const video = videoRef.current;
    if (!video) {
      setErrorMessage('Load a video first.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage(null);
      setProgress(0);
      setDevice(null);
      isActiveRef.current = true;

      // Fresh worker for this session (bundled by Vite, runs off the main thread).
      if (!workerRef.current) {
        const worker = new Worker(
          new URL('../workers/whisper.worker.ts', import.meta.url),
          { type: 'module' }
        );
        worker.addEventListener('message', handleWorkerMessage);
        worker.addEventListener('error', e => {
          setErrorMessage(e.message || 'Whisper worker failed to start.');
          setStatus('error');
          isActiveRef.current = false;
          // A crashed worker cannot be reused — drop it so start() rebuilds it.
          worker.removeEventListener('message', handleWorkerMessage);
          worker.terminate();
          workerRef.current = null;
          teardown();
        });
        workerRef.current = worker;
      }

      cuesRef.current = [];
      lastCueRef.current = null;
      pendingRef.current = [];
      setTranscribedCount(0);
      // Clear any cues left over from a previous session.
      onTrackUpdate(trackId, [], 'whisper');

      // Wire up audio capture from the <video> element.
      const capture = new AudioCapture();
      await capture.start(video);
      captureRef.current = capture;

      chunkStartRef.current = video.currentTime;
      seekedSinceLastChunkRef.current = true;

      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('pause', handlePause);
      video.addEventListener('play', handlePlay);

      workerRef.current.postMessage({
        type: 'load',
        modelId: settingsRef.current.modelId,
      } satisfies WhisperWorkerRequest);

      // Poll the capture buffer and schedule transcriptions.
      timerRef.current = setInterval(collectChunk, TICK_MS);
    } catch (error) {
      isActiveRef.current = false;
      const message = error instanceof Error ? error.message : 'Failed to start transcription.';
      console.error('[useWhisper]', error);
      setErrorMessage(message);
      setStatus('error');
      teardown();
    }
  }, [videoRef, handleWorkerMessage, handleSeeked, handlePause, handlePlay, collectChunk, teardown, onTrackUpdate, trackId]);

  const stop = useCallback(() => {
    teardown();
    // Dispose the model (frees GPU/WASM memory) but keep the worker warm.
    workerRef.current?.postMessage({ type: 'stop' } satisfies WhisperWorkerRequest);
    setStatus('idle');
    setDevice(null);
    setProgress(0);
  }, [teardown]);

  const clearCues = useCallback(() => {
    cuesRef.current = [];
    lastCueRef.current = null;
    setTranscribedCount(0);
    onTrackUpdate(trackId, [], 'whisper');
  }, [onTrackUpdate, trackId]);

  const exportSRT = useCallback(() => {
    if (cuesRef.current.length === 0) return;
    downloadTextFile(`${baseName}.whisper.srt`, generateSRT(cuesRef.current), 'application/x-subrip');
  }, [baseName]);

  const exportTXT = useCallback(() => {
    if (cuesRef.current.length === 0) return;
    downloadTextFile(`${baseName}.whisper.txt`, generateTXT(cuesRef.current));
  }, [baseName]);

  useEffect(() => {
    return () => {
      teardown();
      const worker = workerRef.current;
      if (worker) {
        worker.removeEventListener('message', handleWorkerMessage);
        worker.terminate();
        workerRef.current = null;
      }
    };
    // Cleanup on unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    progress,
    device,
    settings,
    errorMessage,
    transcribedCount,
    updateSettings,
    start,
    stop,
    exportSRT,
    exportTXT,
    clearCues,
  };
}
