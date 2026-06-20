import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  togglePlay: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlers.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlers.skipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlers.skipBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.volumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.volumeDown();
          break;
        case 'm':
          e.preventDefault();
          handlers.toggleMute();
          break;
        case 'f':
          e.preventDefault();
          handlers.toggleFullscreen();
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
