import { motion, AnimatePresence } from 'framer-motion';
import type { SubtitleTrack, PlayerSettings, ThemeMode, LayoutDensity, Season } from '../../types';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (updates: Partial<PlayerSettings>) => void;
  tracks: SubtitleTrack[];
  activeTrackIds: string[];
  onToggleTrack: (id: string) => void;
  onRemoveTrack: (id: string) => void;
  themeMode: ThemeMode;
  onSetThemeMode: (m: ThemeMode) => void;
  layoutDensity: LayoutDensity;
  onSetLayoutDensity: (d: LayoutDensity) => void;
  season: Season;
  onSetSeason: (s: Season) => void;
}

const FONTS = [
  { label: 'System', value: 'system-ui, sans-serif' },
  { label: 'Noto Sans JP', value: '"Noto Sans JP", sans-serif' },
  { label: 'Noto Serif JP', value: '"Noto Serif JP", serif' },
  { label: 'Hiragino', value: '"Hiragino Sans", sans-serif' },
  { label: 'Meiryo', value: '"Meiryo", sans-serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
];

const SUBTITLE_SIZES = [14, 16, 18, 20, 24, 28, 32, 36];

export function Settings({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tracks,
  activeTrackIds,
  onToggleTrack,
  onRemoveTrack,
  themeMode,
  onSetThemeMode,
  layoutDensity,
  onSetLayoutDensity,
  season,
  onSetSeason,
}: SettingsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="settings-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="settings-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="settings-body">
              <div className="settings-section">
                <h3>Theme</h3>
                <div className="theme-options">
                  {(['light', 'dark', 'sepia'] as ThemeMode[]).map(mode => (
                    <button
                      key={mode}
                      className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                      onClick={() => onSetThemeMode(mode)}
                    >
                      <span className="theme-option-icon">
                        {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '📜'}
                      </span>
                      <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-section">
                <h3>Season</h3>
                <div className="season-options">
                  {([
                    { id: 'spring', label: 'Spring', icon: '🌸' },
                    { id: 'summer', label: 'Summer', icon: '🎆' },
                    { id: 'autumn', label: 'Autumn', icon: '🍁' },
                    { id: 'winter', label: 'Winter', icon: '❄️' },
                  ] as { id: Season; label: string; icon: string }[]).map(s => (
                    <button
                      key={s.id}
                      className={`season-option ${season === s.id ? 'active' : ''}`}
                      onClick={() => onSetSeason(s.id)}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-section">
                <h3>Layout</h3>
                <div className="density-options">
                  {(['compact', 'comfortable', 'spacious'] as LayoutDensity[]).map(d => (
                    <button
                      key={d}
                      className={`density-option ${layoutDensity === d ? 'active' : ''}`}
                      onClick={() => onSetLayoutDensity(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-section">
                <h3>Subtitles</h3>
                <div className="setting-row">
                  <span>Size</span>
                  <div className="size-pills">
                    {SUBTITLE_SIZES.map(s => (
                      <button
                        key={s}
                        className={`size-pill ${settings.subtitleSize === s ? 'active' : ''}`}
                        onClick={() => onUpdateSettings({ subtitleSize: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setting-row">
                  <span>Font</span>
                  <select
                    value={settings.subtitleFont}
                    onChange={e => onUpdateSettings({ subtitleFont: e.target.value })}
                    className="setting-select"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="setting-row">
                  <span>Furigana</span>
                  <button
                    className={`toggle-switch ${settings.showFurigana ? 'on' : ''}`}
                    onClick={() => onUpdateSettings({ showFurigana: !settings.showFurigana })}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
                <div className="setting-row">
                  <span>Fullscreen subtitles</span>
                  <button
                    className={`toggle-switch ${settings.showSubtitlesInFullscreen ? 'on' : ''}`}
                    onClick={() => onUpdateSettings({ showSubtitlesInFullscreen: !settings.showSubtitlesInFullscreen })}
                  >
                    <div className="toggle-knob" />
                  </button>
                </div>
              </div>

              {tracks.length > 0 && (
                <div className="settings-section">
                  <h3>Tracks</h3>
                  <div className="track-list">
                    {tracks.map(track => (
                      <div key={track.id} className="track-item">
                        <label className="track-label">
                          <input
                            type="checkbox"
                            checked={activeTrackIds.includes(track.id)}
                            onChange={() => onToggleTrack(track.id)}
                          />
                          <span className="track-name">{track.label}</span>
                          <span className="track-meta">
                            {track.format.toUpperCase()} · {track.cues.length}
                          </span>
                        </label>
                        <button className="track-remove" onClick={() => onRemoveTrack(track.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="settings-section">
                <h3>Shortcuts</h3>
                <div className="shortcuts-grid">
                  <div className="shortcut"><kbd>Space</kbd><span>Play</span></div>
                  <div className="shortcut"><kbd>←</kbd><span>-5s</span></div>
                  <div className="shortcut"><kbd>→</kbd><span>+5s</span></div>
                  <div className="shortcut"><kbd>↑</kbd><span>Vol+</span></div>
                  <div className="shortcut"><kbd>↓</kbd><span>Vol-</span></div>
                  <div className="shortcut"><kbd>M</kbd><span>Mute</span></div>
                  <div className="shortcut"><kbd>F</kbd><span>Fullscreen</span></div>
                  <div className="shortcut"><kbd>K</kbd><span>Play</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
