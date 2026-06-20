import { parseSRT } from './srt';
import { parseVTT } from './vtt';
import { parseASS } from './ass';
import type { SubtitleTrack, SubtitleFormat } from '../types';

export function parseSubtitleFile(
  content: string,
  format: SubtitleFormat,
  label: string,
  language: string
): SubtitleTrack {
  let cues: SubtitleTrack['cues'];
  switch (format) {
    case 'srt':
      cues = parseSRT(content);
      break;
    case 'vtt':
      cues = parseVTT(content);
      break;
    case 'ass':
      cues = parseASS(content);
      break;
    default:
      cues = [];
  }

  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    language,
    cues,
    format,
  };
}

export function detectFormat(filename: string): SubtitleFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'srt') return 'srt';
  if (ext === 'vtt') return 'vtt';
  if (ext === 'ass' || ext === 'ssa') return 'ass';
  return null;
}

export { parseSRT, parseVTT, parseASS };
