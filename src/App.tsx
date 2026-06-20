import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header/Header';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import { SubtitlePanel } from './components/SubtitlePanel/SubtitlePanel';
import { SubtitleImport } from './components/SubtitleImport/SubtitleImport';
import { SubtitleLog } from './components/SubtitleLog/SubtitleLog';
import { Settings } from './components/Settings/Settings';
import { BookmarkPanel } from './components/BookmarkPanel/BookmarkPanel';
import { CommentSection } from './components/CommentSection/CommentSection';
import { MinimalSidebar } from './components/MinimalSidebar/MinimalSidebar';
import { VocabularyList } from './components/VocabularyList/VocabularyList';
import { CherryBlossom } from './components/CherryBlossom/CherryBlossom';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useSubtitles } from './hooks/useSubtitles';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { useVocabulary } from './hooks/useVocabulary';
import { usePanelResize } from './hooks/usePanelResize';
import type { Bookmark, Comment, PlayerSettings } from './types';
import './App.css';

type TabId = 'subtitles' | 'bookmarks' | 'comments' | 'vocabulary' | 'log';

function App() {
  const { themeMode, setThemeMode, cycleTheme, layoutDensity, setLayoutDensity, season, setSeason } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('subtitles');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<PlayerSettings>({
    subtitleSize: 20,
    subtitleFont: '"Noto Sans JP", sans-serif',
    playbackSpeed: 1,
    themeMode: 'dark',
    subtitleTracks: [],
    volume: 1,
    showFurigana: false,
    layoutDensity: 'comfortable',
    season: 'spring',
    showSubtitlesInFullscreen: true,
  });

  const player = useVideoPlayer();
  const { tracks, activeTrackIds, addTrack, removeTrack, toggleTrack, getActiveCues } =
    useSubtitles();
  const vocabulary = useVocabulary();
  const panelResize = usePanelResize();

  const currentCues = useMemo(
    () => getActiveCues(player.currentTime),
    [getActiveCues, player.currentTime]
  );

  const currentSubtitleText = useMemo(
    () => currentCues.map(cues => cues.map(c => c.text).join('\n')).join(' / '),
    [currentCues]
  );

  const handleFullscreenToggle = useCallback(() => {
    player.toggleFullscreen(fullscreenWrapperRef.current);
  }, [player]);

  useEffect(() => {
    const onFsChange = () => {
      player.setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [player]);

  const handleUpdateSettings = useCallback((updates: Partial<PlayerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAddBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks(prev => [...prev, bookmark]);
  }, []);

  const handleRemoveBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleAddComment = useCallback((comment: Comment) => {
    setComments(prev => [...prev, comment]);
  }, []);

  const handleWordSave = useCallback(
    (word: string, sentence: string, timestamp: number) => {
      vocabulary.addWord({ word, sentence, timestamp });
    },
    [vocabulary]
  );

  const handleExportNotes = useCallback(() => {
    const lines = bookmarks.map(bm => {
      const parts = [`[${Math.floor(bm.timestamp / 60)}:${String(Math.floor(bm.timestamp % 60)).padStart(2, '0')}]`];
      parts.push(bm.label);
      if (bm.subtitleText) parts.push(`  → ${bm.subtitleText}`);
      return parts.join(' ');
    });
    const vocabLines = vocabulary.words.map(w => {
      const parts = [w.word];
      if (w.reading) parts.push(`(${w.reading})`);
      if (w.meaning) parts.push(`— ${w.meaning}`);
      return parts.join(' ');
    });
    const content = [
      'Sumire View Notes',
      '='.repeat(40),
      '',
      'Bookmarks',
      '-'.repeat(20),
      lines.join('\n\n'),
      '',
      'Vocabulary',
      '-'.repeat(20),
      vocabLines.join('\n'),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sumire-view-notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [bookmarks, vocabulary.words]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev);
  }, []);

  useKeyboardShortcuts({
    togglePlay: player.togglePlay,
    skipForward: () => player.skip(5),
    skipBackward: () => player.skip(-5),
    volumeUp: () => player.changeVolume(player.volume + 0.1),
    volumeDown: () => player.changeVolume(player.volume - 0.1),
    toggleMute: player.toggleMute,
    toggleFullscreen: handleFullscreenToggle,
  });

  const sidebarTabContent = (
    <>
      {activeTab === 'subtitles' && (
        <div className="flex flex-col gap-3">
          <SubtitleImport onImport={addTrack} />
          {tracks.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                Loaded
              </h4>
              <div className="flex flex-col gap-1">
                {tracks.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'var(--surface-secondary)' }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={activeTrackIds.includes(track.id)}
                        onChange={() => toggleTrack(track.id)}
                        className="accent-[var(--accent)]"
                      />
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {track.label}
                      </span>
                      <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {track.format.toUpperCase()} · {track.cues.length}
                      </span>
                    </label>
                    <button
                      className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => removeTrack(track.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onRemoveBookmark={handleRemoveBookmark}
          onSeek={player.seek}
          currentTime={player.currentTime}
          currentSubtitle={currentSubtitleText}
          onExportNotes={handleExportNotes}
        />
      )}

      {activeTab === 'comments' && (
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
          currentTime={player.currentTime}
        />
      )}

      {activeTab === 'vocabulary' && (
        <VocabularyList
          words={vocabulary.words}
          onRemove={vocabulary.removeWord}
          onSeek={player.seek}
        />
      )}

      {activeTab === 'log' && (
        <SubtitleLog
          tracks={tracks}
          activeTrackIds={activeTrackIds}
          currentTime={player.currentTime}
          onSeek={player.seek}
          showFurigana={settings.showFurigana}
        />
      )}
    </>
  );

  const showSubtitles = !player.isFullscreen || settings.showSubtitlesInFullscreen;

  return (
    <div className="app-root" dir="ltr">
      {season === 'spring' && <CherryBlossom />}

      <AnimatePresence>
        {!player.isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Header
              themeMode={themeMode}
              onCycleTheme={cycleTheme}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-layout">
        <div
          ref={(el) => {
            (fullscreenWrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (panelResize.wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          className={`player-wrapper ${player.isFullscreen ? 'is-fullscreen' : ''}`}
        >
          <div
            className={`video-area ${player.isFullscreen ? 'fs-video' : ''}`}
            style={player.isFullscreen ? undefined : { flex: 'none', height: `calc(${panelResize.ratio * 100}% - ${panelResize.dividerHeight / 2}px)` }}
          >
            <VideoPlayer
              videoRef={player.videoRef}
              isPlaying={player.isPlaying}
              onTogglePlay={player.togglePlay}
              currentTime={player.currentTime}
              onSetCurrentTime={player.seek}
              duration={player.duration}
              volume={player.volume}
              onChangeVolume={player.changeVolume}
              isMuted={player.isMuted}
              onToggleMute={player.toggleMute}
              playbackRate={player.playbackRate}
              onChangePlaybackRate={player.changePlaybackRate}
              onSkip={player.skip}
              onToggleFullscreen={handleFullscreenToggle}
              isFullscreen={player.isFullscreen}
              onLoadVideo={player.loadVideo}
              setIsPlaying={player.setIsPlaying}
              setDuration={player.setDuration}
              setCurrentTime={player.setCurrentTime}
            />
          </div>

          {!player.isFullscreen && showSubtitles && (
            <div
              className="panel-resize-divider"
              onPointerDown={panelResize.onDividerPointerDown}
              onPointerMove={panelResize.onDividerPointerMove}
              onPointerUp={panelResize.onDividerPointerUp}
            />
          )}

          {showSubtitles && (
            <div
              className={`subtitle-area ${player.isFullscreen ? 'fs-subtitle' : ''}`}
              style={player.isFullscreen ? undefined : { flex: 'none', height: `calc(${(1 - panelResize.ratio) * 100}% - ${panelResize.dividerHeight / 2}px)` }}
            >
              <SubtitlePanel
                tracks={tracks}
                activeTrackIds={activeTrackIds}
                currentTime={player.currentTime}
                subtitleSize={settings.subtitleSize}
                subtitleFont={settings.subtitleFont}
                isFullscreen={player.isFullscreen}
                showFurigana={settings.showFurigana}
                onWordSave={handleWordSave}
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {!player.isFullscreen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <MinimalSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isExpanded={sidebarExpanded}
                onToggleExpand={handleToggleSidebar}
                vocabularyCount={vocabulary.words.length}
              >
                {sidebarTabContent}
              </MinimalSidebar>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        tracks={tracks}
        activeTrackIds={activeTrackIds}
        onToggleTrack={toggleTrack}
        onRemoveTrack={removeTrack}
        themeMode={themeMode}
        onSetThemeMode={setThemeMode}
        layoutDensity={layoutDensity}
        onSetLayoutDensity={setLayoutDensity}
        season={season}
        onSetSeason={setSeason}
      />
    </div>
  );
}

export default App;
