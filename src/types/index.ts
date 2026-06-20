export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontName?: string;
  fontSize?: number;
  primaryColor?: string;
  secondaryColor?: string;
  outlineColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  cues: SubtitleCue[];
  format: 'srt' | 'vtt' | 'ass';
}

export interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
  subtitleText?: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  createdAt: number;
  avatar?: string;
}

export interface VideoSource {
  url: string;
  quality: string;
  type?: string;
}

export interface AnimeMetadata {
  title: string;
  titleJapanese?: string;
  episode?: number;
  season?: number;
  coverImage?: string;
  description?: string;
  genres?: string[];
}

export type ThemeMode = 'light' | 'dark' | 'sepia';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface PlayerSettings {
  subtitleSize: number;
  subtitleFont: string;
  playbackSpeed: number;
  themeMode: ThemeMode;
  subtitleTracks: string[];
  volume: number;
  showFurigana: boolean;
  layoutDensity: LayoutDensity;
  season: Season;
  showSubtitlesInFullscreen: boolean;
}

export interface VocabularyWord {
  id: string;
  word: string;
  reading?: string;
  meaning?: string;
  sentence?: string;
  timestamp: number;
  createdAt: number;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass';
