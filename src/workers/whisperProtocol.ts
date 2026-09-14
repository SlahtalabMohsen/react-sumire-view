/**
 * Shared types and constants for the in-browser Whisper transcription worker.
 * Imported by both the worker and the React hook / UI.
 */

export type WhisperDevice = 'webgpu' | 'wasm';

export type WhisperStatus =
  | 'idle'
  | 'loading' // downloading / initialising the model
  | 'listening' // capturing audio, waiting for enough data
  | 'transcribing' // inference in progress
  | 'ready' // model loaded, transcription active but video paused
  | 'error';

/** A single timestamped segment produced by Whisper. */
export interface WhisperSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  source: 'whisper';
}

/** Selectable Whisper models (ONNX, served from the Hugging Face Hub). */
export interface WhisperModelOption {
  id: string;
  label: string;
  /** Approximate download size of the fp32 ONNX weights. */
  size: string;
  note: string;
}

export const WHISPER_MODELS: WhisperModelOption[] = [
  {
    id: 'onnx-community/whisper-tiny',
    label: 'Tiny',
    size: '~155 MB',
    note: 'Fastest — good for slower machines / WASM fallback',
  },
  {
    id: 'onnx-community/whisper-base',
    label: 'Base',
    size: '~290 MB',
    note: 'Balanced accuracy and speed (recommended)',
  },
  {
    id: 'onnx-community/whisper-small',
    label: 'Small',
    size: '~950 MB',
    note: 'Best Japanese accuracy — needs WebGPU',
  },
];

/**
 * Download size note: on the WebGPU backend the fp32 weights are fetched
 * (sizes above). Without WebGPU the WASM backend uses ~4× smaller q8
 * quantised weights instead.
 */

export const DEFAULT_WHISPER_MODEL = WHISPER_MODELS[1].id;

/* ----------------------------- Worker protocol ---------------------------- */

/** Main thread → worker. */
export type WhisperWorkerRequest =
  | { type: 'load'; modelId: string }
  | {
      type: 'transcribe';
      /** Unique id echoed back with the result. */
      id: string;
      /** Raw mono PCM captured from the <video> element. */
      audio: Float32Array;
      /** Sample rate of `audio`. */
      sampleRate: number;
      /** Presentation time (seconds) of the first sample. */
      offset: number;
      language: string;
      task: 'transcribe' | 'translate';
    }
  | { type: 'stop' };

/** Worker → main thread. */
export type WhisperWorkerResponse =
  | { type: 'status'; status: 'loading' | 'transcribing' | 'idle' }
  | {
      type: 'progress';
      /** 0–100 model download progress. */
      progress: number;
      file?: string;
      loaded?: number;
      total?: number;
    }
  | { type: 'ready'; device: WhisperDevice; dtype: string; modelId: string }
  | {
      type: 'result';
      id: string;
      offset: number;
      segments: { start: number; end: number; text: string }[];
      text: string;
    }
  | { type: 'error'; message: string };
