import { useRef, useState, useEffect, useCallback, memo, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../../utils/time';
import './VideoPlayer.css';

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  onSetCurrentTime: (t: number) => void;
  duration: number;
  volume: number;
  onChangeVolume: (v: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playbackRate: number;
  onChangePlaybackRate: (r: number) => void;
  onSkip: (s: number) => void;
  onToggleFullscreen: (el: HTMLElement | null) => void;
  isFullscreen: boolean;
  onLoadVideo: (url: string) => void;
  setIsPlaying: (p: boolean) => void;
  setDuration: (d: number) => void;
  setCurrentTime: (t: number) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer = memo(function VideoPlayer({
  videoRef,
  isPlaying,
  onTogglePlay,
  currentTime,
  onSetCurrentTime,
  duration,
  volume,
  onChangeVolume,
  isMuted,
  onToggleMute,
  playbackRate,
  onChangePlaybackRate,
  onSkip,
  onToggleFullscreen,
  isFullscreen,
  onLoadVideo,
  setIsPlaying,
  setDuration,
  setCurrentTime,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hasSource, setHasSource] = useState(false);
  const [showPlayPulse, setShowPlayPulse] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  }, [videoRef, setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, [videoRef, setDuration]);

  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return;
    setBuffered(video.buffered.end(video.buffered.length - 1));
  }, [videoRef]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      onSetCurrentTime(pct * duration);
    },
    [duration, onSetCurrentTime]
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      setHoverTime(pct * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        onLoadVideo(URL.createObjectURL(file));
      }
    },
    [onLoadVideo]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onLoadVideo(URL.createObjectURL(file));
    },
    [onLoadVideo]
  );

  const handleVideoClick = useCallback(() => {
    onTogglePlay();
    setShowPlayPulse(true);
    setTimeout(() => setShowPlayPulse(false), 600);
  }, [onTogglePlay]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (isPlaying) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedData = () => setHasSource(true);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadeddata', onLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, [videoRef, handleTimeUpdate, handleLoadedMetadata, handleProgress, setIsPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`video-container ${showControls || !isPlaying ? 'controls-visible' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDragOver={e => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      <video
        ref={videoRef}
        className="video-element"
        onClick={handleVideoClick}
        playsInline
        aria-label="Video player"
      />

      {!hasSource && (
        <motion.div
          className="video-drop-zone"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="drop-visual">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p className="drop-label">Drop video here</p>
          <p className="drop-sub">or</p>
          <label className="drop-file-btn">
            Choose file
            <input type="file" accept="video/*" onChange={handleFileSelect} hidden />
          </label>
        </motion.div>
      )}

      <AnimatePresence>
        {showPlayPulse && (
          <motion.div
            className="play-pulse"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {isPlaying ? '▶' : '⏸'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showControls || !isPlaying) && (
          <motion.div
            className="video-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="controls-progress">
              <div
                className="progress-track"
                onClick={handleProgressClick}
                onMouseMove={handleProgressHover}
                onMouseLeave={() => setHoverTime(null)}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div className="progress-buffered" style={{ width: `${bufferedPct}%` }} />
                <div className="progress-played" style={{ width: `${progress}%` }}>
                  <div className="progress-thumb" />
                </div>
                {hoverTime !== null && (
                  <div className="progress-tooltip" style={{ left: hoverX }}>
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>
            </div>

            <div className="controls-row">
              <div className="controls-left">
                <motion.button
                  className="ctrl-btn"
                  onClick={onTogglePlay}
                  whileTap={{ scale: 0.9 }}
                  title="Play/Pause (Space)"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </motion.button>

                <motion.button
                  className="ctrl-btn"
                  onClick={() => onSkip(-5)}
                  whileTap={{ scale: 0.9 }}
                  title="Back 5s (←)"
                  aria-label="Skip backward 5 seconds"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </motion.button>

                <motion.button
                  className="ctrl-btn"
                  onClick={() => onSkip(5)}
                  whileTap={{ scale: 0.9 }}
                  title="Forward 5s (→)"
                  aria-label="Skip forward 5 seconds"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </motion.button>

                <div className="volume-group">
                  <motion.button
                    className="ctrl-btn"
                    onClick={onToggleMute}
                    whileTap={{ scale: 0.9 }}
                    title="Mute (M)"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </motion.button>
                  <input
                    type="range"
                    className="volume-range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={e => onChangeVolume(Number(e.target.value))}
                    aria-label="Volume"
                  />
                </div>

                <span className="time-label">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="controls-right">
                <div className="speed-group">
                  <motion.button
                    className="ctrl-btn speed-trigger"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    whileTap={{ scale: 0.95 }}
                    title="Speed"
                    aria-label={`Playback speed: ${playbackRate}x`}
                    aria-expanded={showSpeedMenu}
                  >
                    {playbackRate}x
                  </motion.button>
                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        className="speed-menu"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {PLAYBACK_RATES.map(rate => (
                          <button
                            key={rate}
                            className={`speed-option ${rate === playbackRate ? 'active' : ''}`}
                            onClick={() => {
                              onChangePlaybackRate(rate);
                              setShowSpeedMenu(false);
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  className="ctrl-btn"
                  onClick={() => onToggleFullscreen(containerRef.current)}
                  whileTap={{ scale: 0.9 }}
                  title="Fullscreen (F)"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
