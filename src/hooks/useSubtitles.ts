import { useCallback, useState } from 'react';
import type { SubtitleTrack, SubtitleCue } from '../types';

export function useSubtitles() {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [activeTrackIds, setActiveTrackIds] = useState<string[]>([]);

  const addTrack = useCallback((track: SubtitleTrack) => {
    setTracks(prev => [...prev, track]);
    setActiveTrackIds(prev => {
      if (prev.length === 0) return [track.id];
      return prev;
    });
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setActiveTrackIds(prev => prev.filter(id => id !== trackId));
  }, []);

  const toggleTrack = useCallback((trackId: string) => {
    setActiveTrackIds(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      }
      return [...prev, trackId];
    });
  }, []);

  const getActiveCues = useCallback(
    (time: number): SubtitleCue[][] => {
      return activeTrackIds.map(trackId => {
        const track = tracks.find(t => t.id === trackId);
        if (!track) return [];
        return track.cues.filter(
          cue => time >= cue.startTime && time <= cue.endTime
        );
      });
    },
    [tracks, activeTrackIds]
  );

  return {
    tracks,
    activeTrackIds,
    addTrack,
    removeTrack,
    toggleTrack,
    getActiveCues,
  };
}
