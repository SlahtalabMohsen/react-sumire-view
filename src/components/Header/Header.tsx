import { motion } from 'framer-motion';
import type { ThemeMode } from '../../types';
import './Header.css';

interface HeaderProps {
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  onOpenSettings: () => void;
  metadata?: {
    title: string;
    titleJapanese?: string;
    episode?: number;
  };
}

const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
  sepia: '📜',
};

export function Header({ themeMode, onCycleTheme, onOpenSettings, metadata }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-mark">
          <span className="logo-kanji">菫</span>
        </div>
        <span className="logo-text">Sumire View</span>
      </div>

      {metadata && (
        <div className="header-center">
          <h1 className="anime-title">{metadata.title}</h1>
          {metadata.titleJapanese && (
            <span className="anime-title-jp">{metadata.titleJapanese}</span>
          )}
          {metadata.episode != null && (
            <span className="episode-pill">EP {metadata.episode}</span>
          )}
        </div>
      )}

      <div className="header-right">
        <motion.button
          className="header-btn"
          onClick={onOpenSettings}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
          aria-label="Open settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </motion.button>
        <motion.button
          className="header-btn theme-btn"
          onClick={onCycleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`Theme: ${themeMode}`}
          aria-label={`Current theme: ${themeMode}. Click to cycle theme.`}
        >
          <span className="theme-icon">{THEME_ICONS[themeMode] || '☀️'}</span>
        </motion.button>
      </div>
    </header>
  );
}
