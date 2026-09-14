import type { SubtitleCue } from '../types';

/**
 * Formats a timestamp in seconds as an SRT timestamp: HH:MM:SS,mmm
 */
export function formatSrtTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Generates a SubRip (.srt) document from cues.
 * Timestamps are emitted in the standard `HH:MM:SS,mmm --> HH:MM:SS,mmm` form
 * and the (Japanese) text is written verbatim.
 */
export function generateSRT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  const blocks: string[] = [];

  sorted.forEach((cue, index) => {
    const text = cue.text.trim();
    if (!text) return;
    // Guard against malformed ranges (end must be strictly after start)
    const end = cue.endTime > cue.startTime ? cue.endTime : cue.startTime + 1;
    blocks.push(
      `${index + 1}\n${formatSrtTime(cue.startTime)} --> ${formatSrtTime(end)}\n${text}`
    );
  });

  return blocks.join('\n\n') + (blocks.length ? '\n' : '');
}

/**
 * Generates a plain-text transcript: one line per cue with a leading timestamp.
 */
export function generateTXT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  return sorted
    .filter(cue => cue.text.trim())
    .map(cue => `[${formatSrtTime(cue.startTime)}] ${cue.text.trim()}`)
    .join('\n');
}

/**
 * Triggers a client-side download of text content.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain'
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sanitises a string so it is safe to use as a downloaded file name.
 */
export function sanitizeFileName(name: string): string {
  const withoutControlChars = name
    .split('')
    .map(char => (char.charCodeAt(0) < 0x20 ? ' ' : char))
    .join('');
  const cleaned = withoutControlChars
    .replace(/[<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : 'subtitles';
}
