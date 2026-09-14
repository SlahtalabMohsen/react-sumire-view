/// <reference lib="webworker" />
/**
 * Whisper transcription worker.
 *
 * Runs Whisper (Transformers.js + ONNX) 100% locally, off the main thread:
 *  - Prefers the WebGPU backend, falling back to WASM.
 *  - Downloads the model once (cached in the browser via the Cache API /
 *    IndexedDB by Transformers.js) and reuses it offline afterwards.
 *  - Receives raw PCM captured from the <video> element and returns
 *    timestamped segments. Transcription is `ja` / `transcribe` only — no
 *    translation — and no audio ever leaves the browser.
 */

import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
  type PretrainedModelOptions,
} from '@huggingface/transformers';
import type {
  WhisperWorkerRequest,
  WhisperWorkerResponse,
  WhisperDevice,
} from './whisperProtocol';

// Fetch models from the Hugging Face Hub and cache them in the browser so the
// download only happens once.
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
// Keep runtime chatter quiet; the UI surfaces its own status.
env.logLevel = 40; // ERROR

const WHISPER_SAMPLE_RATE = 16000;

let pipe: AutomaticSpeechRecognitionPipeline | null = null;
let loadedModelId: string | null = null;
let activeDevice: WhisperDevice | null = null;

function post(message: WhisperWorkerResponse): void {
  (self as DedicatedWorkerGlobalScope).postMessage(message);
}

interface LoadConfig {
  device?: WhisperDevice;
  dtype: 'fp32' | 'fp16' | 'q8';
}

/**
 * Attempts to construct the pipeline with the given configuration, throwing
 * if the backend is unavailable (e.g. no WebGPU).
 */
async function tryLoad(modelId: string, config: LoadConfig): Promise<void> {
  const options: PretrainedModelOptions = {
    dtype: config.dtype,
    progress_callback: (data: unknown) => {
      const progress = data as {
        status: string;
        progress?: number;
        loaded?: number;
        total?: number;
        file?: string;
      };
      if (progress.status === 'progress') {
        post({
          type: 'progress',
          progress: Math.min(100, Math.max(0, progress.progress ?? 0)),
          file: progress.file,
          loaded: progress.loaded,
          total: progress.total,
        });
      }
    },
  };
  if (config.device) {
    options.device = config.device;
  }
  pipe = (await pipeline(
    'automatic-speech-recognition',
    modelId,
    options
  )) as AutomaticSpeechRecognitionPipeline;
  activeDevice = config.device ?? 'wasm';
}

async function loadModel(modelId: string): Promise<void> {
  if (pipe && loadedModelId === modelId) {
    post({
      type: 'ready',
      device: activeDevice ?? 'wasm',
      dtype: 'fp32',
      modelId,
    });
    return;
  }

  // Dispose any previously loaded model to avoid leaking GPU/memory.
  await dispose();
  loadedModelId = modelId;
  post({ type: 'status', status: 'loading' });
  post({ type: 'progress', progress: 0 });

  // Prefer WebGPU with fp32 weights; fall back to quantised (q8) weights on
  // the WASM/CPU backend, which keeps download size and inference time sane
  // without a GPU. This mirrors Transformers.js' own backend defaults.
  const supportsWebGPU =
    typeof navigator !== 'undefined' && 'gpu' in navigator;
  const configs: LoadConfig[] = supportsWebGPU
    ? [
        { device: 'webgpu', dtype: 'fp32' },
        { dtype: 'q8' }, // WASM
      ]
    : [{ dtype: 'q8' }];

  let lastError: unknown = null;
  for (const config of configs) {
    try {
      await tryLoad(modelId, config);
      post({ type: 'progress', progress: 100 });
      post({
        type: 'ready',
        device: activeDevice ?? 'wasm',
        dtype: config.dtype,
        modelId,
      });
      return;
    } catch (error) {
      lastError = error;
      console.warn('[whisper.worker] load config failed:', config, error);
    }
  }

  post({
    type: 'error',
    message:
      'Failed to load the Whisper model in the browser. Please use a recent Chrome, Edge or Firefox build.',
  });
  throw lastError ?? new Error('Failed to load Whisper model.');
}

async function dispose(): Promise<void> {
  if (pipe) {
    try {
      await pipe.dispose?.();
    } catch {
      // ignore
    }
    pipe = null;
  }
  activeDevice = null;
}

/**
 * Downsamples to 16 kHz with a box-filter (low-pass + decimation), which
 * avoids the aliasing artifacts plain linear interpolation would introduce.
 */
function resampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === WHISPER_SAMPLE_RATE) return input;
  const step = fromRate / WHISPER_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / step);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = i * step;
    const end = Math.min(input.length, (i + 1) * step);
    let sum = 0;
    let count = 0;
    for (let j = Math.floor(start); j < end; j++) {
      sum += input[j];
      count++;
    }
    output[i] = count > 0 ? sum / count : 0;
  }
  return output;
}

/** Cheap RMS check so we don't burn inference cycles on silent stretches. */
function isMostlySilence(audio: Float32Array, threshold = 0.004): boolean {
  let sumSquares = 0;
  for (let i = 0; i < audio.length; i++) {
    sumSquares += audio[i] * audio[i];
  }
  return Math.sqrt(sumSquares / audio.length) < threshold;
}

type TranscribeRequest = Extract<WhisperWorkerRequest, { type: 'transcribe' }>;

async function transcribe(request: TranscribeRequest): Promise<void> {
  if (!pipe) {
    throw new Error('Whisper model is not loaded yet.');
  }

  const audio16k = resampleTo16k(request.audio, request.sampleRate);
  if (audio16k.length < WHISPER_SAMPLE_RATE / 2) return; // < 0.5s — nothing to do
  if (isMostlySilence(audio16k)) return;

  post({ type: 'status', status: 'transcribing' });

  const language = request.language === 'auto' ? undefined : request.language;

  const result = (await pipe(audio16k, {
    // Omitting `language` lets Whisper auto-detect the source language.
    ...(language ? { language } : {}),
    task: request.task,
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  })) as {
    text?: string;
    chunks?: { timestamp: [number | null, number | null]; text: string }[];
  };

  const text = (result.text ?? '').trim();
  const segments: { start: number; end: number; text: string }[] = [];

  if (Array.isArray(result.chunks)) {
    for (const chunk of result.chunks) {
      const segmentText = chunk.text?.trim();
      if (!segmentText) continue;
      const start = chunk.timestamp?.[0] ?? 0;
      const end = chunk.timestamp?.[1] ?? start;
      segments.push({
        start,
        end: end > start ? end : start + 1,
        text: segmentText,
      });
    }
  } else if (text) {
    segments.push({
      start: 0,
      end: audio16k.length / WHISPER_SAMPLE_RATE,
      text,
    });
  }

  post({
    type: 'result',
    id: request.id,
    offset: request.offset,
    segments,
    text,
  });
}

self.onmessage = async (event: MessageEvent<WhisperWorkerRequest>): Promise<void> => {
  const request = event.data;
  try {
    switch (request.type) {
      case 'load':
        await loadModel(request.modelId);
        break;
      case 'transcribe':
        await transcribe(request);
        break;
      case 'stop':
        await dispose();
        loadedModelId = null;
        post({ type: 'status', status: 'idle' });
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Whisper worker error';
    console.error('[whisper.worker]', error);
    post({ type: 'error', message });
  }
};
