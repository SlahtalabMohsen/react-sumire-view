import type { SubtitleCue } from '../types';

export function parseVTT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const text = content.replace(/^\uFEFF/, '');
  const blocks = text.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);

    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/
    );
    if (!timeMatch) continue;

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!text) continue;

    cues.push({
      id: `vtt-${cues.length}`,
      startTime: parseVTTTime(timeMatch[1]),
      endTime: parseVTTTime(timeMatch[2]),
      text,
    });
  }

  return cues;
}

function parseVTTTime(time: string): number {
  const parts = time.split(':');
  if (parts.length === 3) {
    const [h, m, rest] = parts;
    const [s, ms] = rest.split('.').map(Number);
    return Number(h) * 3600 + Number(m) * 60 + s + ms / 1000;
  }
  const [m, rest] = parts;
  const [s, ms] = rest.split('.').map(Number);
  return Number(m) * 60 + s + ms / 1000;
}
