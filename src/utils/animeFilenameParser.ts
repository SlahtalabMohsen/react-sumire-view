/**
 * Detects an anime title, season and episode number from a video file name.
 *
 * Supported episode patterns (among others):
 *   S01E03 / S1 E3 / 1x03          Season + episode numbering
 *   E03 / EP03 / Ep. 3 / Episode 3 Explicit episode marker
 *   #03                            Hash marker
 *   第3話 / 第03話 / 第1章          Japanese episode markers
 *   "- 03" / " 03"                 Bare trailing number
 *
 * This is a best-effort heuristic — the UI always lets the user correct the
 * detected title before searching.
 */

export interface ParsedAnime {
  /** Best-effort title guess. */
  title: string;
  /** Detected season number, if any. */
  season?: number;
  /** Detected episode number, if any. */
  episode?: number;
}

/**
 * Technical release tags that carry no title information.
 * Deliberately conservative — words that commonly appear inside real titles
 * ("End", "Final", "Web"…) are left alone so detection never eats a title.
 */
const NOISE_TAGS = [
  'bdrip', 'bluray', 'blu-ray', 'remux', 'web-dl', 'webdl', 'webrip',
  'x264', 'x265', 'h264', 'h265', 'hevc', 'avc', 'aac', 'flac', 'opus',
  'truehd', '10bit', '10-bit', 'hi10', 'hi10p',
];

const NOISE_RE = new RegExp(
  NOISE_TAGS.map(t => `\\b${t.replace(/-/g, '\\-')}\\b`).join('|'),
  'gi'
);

const EPISODE_PATTERNS: RegExp[] = [
  // S01E03 / S1E3 / S01 E3 / S1-3
  /S(\d{1,2})\s*(?:[Ex×x]\s*|-)?\s*(\d{1,3})(?!\d)/i,
  // 1x03
  /(\d{1,2})[xX×](\d{1,3})(?!\d)/,
  // 第3話 / 第03話 / 第1章 / 第3回
  /第\s*(\d{1,3})\s*[話话章回]/,
  // Ep. 3 / EP03 / Episode 3
  /\b(?:eps?|episode)[.\s-]*(\d{1,3})\b/i,
  // Standalone E03
  /\bE\s?(\d{1,3})\b/i,
  // #03
  /#\s?(\d{1,3})\b/,
  // "- 03" / "- 03v2" / "- 7 END" (guard against resolution suffixes like 720p)
  /[-–—]\s*(\d{1,3})\s*(?:v\d+|(?!p\b|i\b)[A-Za-z]{1,8})?\s*(?=\[|\(|\{|$)/i,
  // bare trailing number (optionally with a version suffix like 03v2)
  /(?:^|[\s.\-_])(\d{1,3})\s*(?:v\d+)?$/,
];

const SEASON_PATTERNS: RegExp[] = [
  /Season\s?(\d{1,2})/i,
  /(\d{1,2})(?:st|nd|rd|th)\s*Season/i,
  /第\s*(\d{1,2})\s*[期季]/,
  /\bS(\d{1,2})\s*(?:$|[\s.-])/i,
];

function toNumber(raw: string): number | undefined {
  const n = parseInt(raw, 10);
  if (!isFinite(n) || n <= 0 || n > 999) return undefined;
  return n;
}

function cleanTitle(name: string): string {
  return name
    // Drop Japanese/ASCII release-group prefixes: 【…】 / [Group] / (Group)
    .replace(/^\s*(?:【[^】]*】|\[[^\]]*\]|\([^)]*\))\s*/g, '')
    // Drop any remaining bracketed metadata (CRC, "(1080p)", "(2023)"…)
    .replace(/【[^】]*】/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    // Resolutions & dimensions
    .replace(/\d{3,4}\s*[xX×]\s*\d{3,4}/g, ' ')
    .replace(/\b\d{3,4}[pP]\b/g, ' ')
    // Codec/container noise
    .replace(NOISE_RE, ' ')
    // Separators → spaces
    .replace(/[._]/g, ' ')
    // Collapse whitespace + tidy leftover punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–—]\s*$/, '')
    .trim();
}

export function parseAnimeFilename(filename: string): ParsedAnime {
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  let season: number | undefined;
  let episode: number | undefined;
  let working = withoutExt;

  // --- Season ---
  for (const pattern of SEASON_PATTERNS) {
    const match = pattern.exec(working);
    if (match && match[1]) {
      const value = toNumber(match[1]);
      if (value !== undefined) {
        season = value;
        working = working.replace(match[0], ' ');
        break;
      }
    }
  }

  // --- Episode ---
  for (const pattern of EPISODE_PATTERNS) {
    const match = pattern.exec(working);
    if (!match) continue;
    const candidate = toNumber(match[2] ?? match[1]);
    if (candidate === undefined) continue;
    episode = candidate;
    // Combined "S1E3" patterns also carry the season.
    if (match[2] && match[1] && season === undefined) {
      const s = toNumber(match[1]);
      if (s !== undefined) season = s;
    }
    working = working.replace(match[0], ' ');
    break;
  }

  const title = cleanTitle(working);
  return {
    title: title.length > 0 ? title : cleanTitle(withoutExt),
    season,
    episode,
  };
}
