import type { SubtitleCue, SubtitleStyle } from '../types';

export function parseASS(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split(/\r?\n/);

  let inEvents = false;
  let formatFields: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[Events]') {
      inEvents = true;
      continue;
    }
    if (trimmed.startsWith('[') && trimmed !== '[Events]') {
      inEvents = false;
      continue;
    }

    if (!inEvents) continue;

    if (trimmed.startsWith('Format:')) {
      formatFields = trimmed
        .replace('Format:', '')
        .split(',')
        .map(f => f.trim().toLowerCase());
      continue;
    }

    if (!trimmed.startsWith('Dialogue:')) continue;

    const afterDialogue = trimmed.substring('Dialogue:'.length).trim();
    const maxFields = formatFields.length - 1;
    const values: string[] = [];

    let remaining = afterDialogue;
    for (let i = 0; i < maxFields; i++) {
      const field = formatFields[i];
      if (field === 'text') {
        values.push(remaining);
        break;
      }
      const nextComma = remaining.indexOf(',');
      if (nextComma === -1) {
        values.push(remaining);
        break;
      }
      values.push(remaining.substring(0, nextComma).trim());
      remaining = remaining.substring(nextComma + 1);
    }

    const getField = (name: string): string => {
      const idx = formatFields.indexOf(name);
      return idx >= 0 && idx < values.length ? values[idx] : '';
    };

    const startTime = parseASSTime(getField('start'));
    const endTime = parseASSTime(getField('end'));
    const rawText = getField('text');

    if (!rawText || rawText === '\\N' || rawText === '\\n') continue;

    const style = parseASSStyle(rawText);
    const cleanText = rawText
      .replace(/\\N/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\{[^}]*\}/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!cleanText) continue;

    cues.push({
      id: `ass-${cues.length}`,
      startTime,
      endTime,
      text: cleanText,
      style: Object.keys(style).length > 0 ? style : undefined,
    });
  }

  return cues;
}

function parseASSTime(time: string): number {
  const match = time.trim().match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;
  return (
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 100
  );
}

function parseASSStyle(text: string): SubtitleStyle {
  const style: SubtitleStyle = {};
  const boldMatch = text.match(/\{\\b(\d+)/);
  if (boldMatch) style.bold = boldMatch[1] !== '0';
  const italicMatch = text.match(/\{\\i(\d+)/);
  if (italicMatch) style.italic = italicMatch[1] !== '0';
  const fontSizeMatch = text.match(/\{\\fs(\d+)/);
  if (fontSizeMatch) style.fontSize = Number(fontSizeMatch[1]);
  return style;
}
