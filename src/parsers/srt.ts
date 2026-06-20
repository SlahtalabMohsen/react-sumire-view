import type { SubtitleCue } from '../types';

export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 2) continue;

    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    );
    if (!timeMatch) continue;

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!text) continue;

    cues.push({
      id: `srt-${cues.length}`,
      startTime: parseSRTTime(timeMatch[1]),
      endTime: parseSRTTime(timeMatch[2]),
      text,
    });
  }

  return cues;
}

function parseSRTTime(time: string): number {
  const [rest, ms] = time.replace(',', '.').split('.');
  const [h, m, s] = rest.split(':').map(Number);
  return h * 3600 + m * 60 + s + parseInt(ms, 10) / 1000;
}
