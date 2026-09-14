/**
 * Captures audio from a <video> element using the Web Audio API and exposes it
 * as raw mono PCM (Float32Array) for the Whisper worker to transcribe.
 *
 * Key insight: createMediaElementSource() takes ownership of the video's audio
 * output. We keep the graph connected to `context.destination` so playback
 * continues normally while we tap the signal for transcription.
 *
 * Capturing is paused automatically while the video is paused (no silence is
 * buffered) and the buffer can be dropped on seeks so segments stay aligned
 * with the presentation timeline.
 */

interface VideoAudioState {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  analyser: AnalyserNode;
}

// One AudioContext + source node per video element (createMediaElementSource
// can only be called once per element, so the graph is created lazily once and
// reused for the element's lifetime).
const videoState = new WeakMap<HTMLVideoElement, VideoAudioState>();

export interface AudioChunk {
  audio: Float32Array;
  sampleRate: number;
}

export class AudioCapture {
  private buffer: Float32Array[] = [];
  private sampleRate = 44100;
  private videoElement: HTMLVideoElement | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isCapturing = false;

  /** True once the capture graph has been wired up. */
  get isActive(): boolean {
    return this.isCapturing;
  }

  get currentSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Connects the capture graph to the video element and starts buffering audio.
   * Safe to call repeatedly; the graph is only created once per element.
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;

    let state = videoState.get(videoElement);
    if (!state) {
      const context = new AudioContext();
      if (context.state === 'suspended') {
        await context.resume();
      }

      const source: MediaElementAudioSourceNode =
        context.createMediaElementSource(videoElement);

      // Passthrough gain keeps the graph alive and lets us insert the tap.
      const gainNode = context.createGain();
      gainNode.gain.value = 1;

      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;

      // source → gain → analyser → destination (audio keeps playing)
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(context.destination);

      state = { context, source, gainNode, analyser };
      videoState.set(videoElement, state);
    }

    if (state.context.state === 'suspended') {
      await state.context.resume();
    }

    this.sampleRate = state.context.sampleRate;

    if (!this.isCapturing) {
      this.processorNode = state.context.createScriptProcessor(4096, 1, 1);
      this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
        if (!this.isCapturing || !this.videoElement) return;
        // Skip while paused so the buffer never fills with silence.
        if (this.videoElement.paused) return;
        // Copy — the underlying buffer is reused by the browser.
        this.buffer.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };

      // Insert the tap: gain → processor → analyser
      state.gainNode.disconnect();
      state.gainNode.connect(this.processorNode);
      this.processorNode.connect(state.analyser);

      this.isCapturing = true;
    }
  }

  /**
   * Merges and returns the audio buffered since the last call, clearing it.
   */
  collectChunk(): AudioChunk | null {
    if (this.buffer.length === 0) return null;

    let totalLength = 0;
    for (const chunk of this.buffer) {
      totalLength += chunk.length;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.buffer) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    this.buffer = [];

    return { audio: merged, sampleRate: this.sampleRate };
  }

  /** Drops any buffered audio (e.g. immediately after a seek). */
  clearBuffer(): void {
    this.buffer = [];
  }

  /** Estimated duration (seconds) of the currently buffered audio. */
  get bufferedSeconds(): number {
    let samples = 0;
    for (const chunk of this.buffer) samples += chunk.length;
    return samples / this.sampleRate;
  }

  /**
   * Detaches the capture tap and restores the direct audio path. Playback is
   * unaffected.
   */
  stop(): void {
    this.isCapturing = false;
    this.restoreDirectPath();
    this.buffer = [];
  }

  destroy(): void {
    this.stop();
    this.videoElement = null;
  }

  private restoreDirectPath(): void {
    const video = this.videoElement;
    if (!video) return;
    const state = videoState.get(video);
    if (!state) return;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {
        // already disconnected
      }
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    try {
      state.gainNode.disconnect();
    } catch {
      // already disconnected
    }
    state.gainNode.connect(state.analyser);
  }
}
