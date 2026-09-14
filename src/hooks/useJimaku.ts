import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SubtitleTrack } from '../types';
import {
  JimakuClient,
  getStoredApiKey,
  storeApiKey,
  clearStoredApiKey,
  rankEpisodeFiles,
  type JimakuEntry,
  type JimakuFile,
} from '../services/jimaku';
import { parseAnimeFilename, type ParsedAnime } from '../utils/animeFilenameParser';
import { detectFormat, parseSubtitleFile } from '../parsers';

export type JimakuLoadingState = 'idle' | 'searching' | 'files' | 'downloading';

export interface UseJimakuOptions {
  videoFileName?: string;
  /** Creates a subtitle track in the player. */
  onLoadTrack: (track: SubtitleTrack) => void;
}

export interface UseJimakuResult {
  /** Key present in local storage. */
  hasApiKey: boolean;
  /** Current value of the editable key field. */
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  saveApiKey: () => void;
  forgetApiKey: () => void;

  /** Detected anime info from the loaded file name. */
  detected: ParsedAnime | null;
  /** Editable search query (pre-filled from detection). */
  query: string;
  setQuery: (value: string) => void;
  /** Editable episode override. */
  episode: number | undefined;
  setEpisode: (value: number | undefined) => void;

  entries: JimakuEntry[];
  selectedEntry: JimakuEntry | null;
  files: JimakuFile[];
  loading: JimakuLoadingState;
  error: string | null;

  search: (query?: string) => Promise<void>;
  selectEntry: (entry: JimakuEntry) => Promise<void>;
  loadSubtitle: (file: JimakuFile) => Promise<void>;
  downloadSubtitle: (file: JimakuFile) => Promise<void>;
}

/** Subtitle archives are sometimes Japanese-encoded; fall back gracefully. */
async function blobToText(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!/\uFFFD/.test(utf8)) return utf8;
  try {
    return new TextDecoder('shift-jis').decode(buffer);
  } catch {
    return utf8;
  }
}

export function useJimaku({ videoFileName, onLoadTrack }: UseJimakuOptions): UseJimakuResult {
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getStoredApiKey());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [query, setQuery] = useState('');
  const [episode, setEpisode] = useState<number | undefined>(undefined);
  const [entries, setEntries] = useState<JimakuEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JimakuEntry | null>(null);
  const [files, setFiles] = useState<JimakuFile[]>([]);
  const [loading, setLoading] = useState<JimakuLoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<JimakuClient>(new JimakuClient(getStoredApiKey()));

  /** Anime/season/episode detected from the loaded file name. */
  const detected = useMemo<ParsedAnime | null>(
    () => (videoFileName ? parseAnimeFilename(videoFileName) : null),
    [videoFileName]
  );

  // Reset the workflow whenever a different video file is loaded.
  const [trackedVideoName, setTrackedVideoName] = useState<string | undefined>(videoFileName);
  if (trackedVideoName !== videoFileName) {
    setTrackedVideoName(videoFileName);
    setQuery(detected?.title ?? '');
    setEpisode(detected?.episode);
    setEntries([]);
    setSelectedEntry(null);
    setFiles([]);
    setError(null);
  }

  const search = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;
      if (!clientRef.current.hasApiKey) {
        setError('Add your Jimaku API key to search for subtitles.');
        return;
      }
      setLoading('searching');
      setError(null);
      try {
        const results = await clientRef.current.search(q);
        setEntries(results);
        setSelectedEntry(null);
        setFiles([]);
        if (results.length === 0) {
          setError('No anime found for that title. Try a different spelling.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Jimaku search failed.');
        setEntries([]);
      } finally {
        setLoading('idle');
      }
    },
    [query]
  );

  const saveApiKey = useCallback(() => {
    const key = apiKeyInput.trim();
    storeApiKey(key);
    clientRef.current.setApiKey(key || null);
    setHasApiKey(!!key);
    setError(null);
    if (key) {
      setApiKeyInput('');
      // If a video is already loaded, search for it right away.
      if (query.trim() && entries.length === 0) {
        void search(query);
      }
    }
  }, [apiKeyInput, query, entries.length, search]);

  const forgetApiKey = useCallback(() => {
    clearStoredApiKey();
    clientRef.current.setApiKey(null);
    setHasApiKey(false);
    setApiKeyInput('');
    setEntries([]);
    setSelectedEntry(null);
    setFiles([]);
  }, []);

  const loadFiles = useCallback(
    async (entry: JimakuEntry, ep?: number) => {
      setLoading('files');
      setError(null);
      try {
        const result = await clientRef.current.getFiles(entry.id, ep);
        setFiles(ep !== undefined ? rankEpisodeFiles(result, ep) : result);
        if (result.length === 0) {
          setError('No subtitle files are available for this entry yet.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to list subtitle files.');
        setFiles([]);
      } finally {
        setLoading('idle');
      }
    },
    []
  );

  const selectEntry = useCallback(
    async (entry: JimakuEntry) => {
      setSelectedEntry(entry);
      await loadFiles(entry, episode);
    },
    [episode, loadFiles]
  );

  const loadSubtitle = useCallback(
    async (file: JimakuFile) => {
      setLoading('downloading');
      setError(null);
      try {
        const blob = await clientRef.current.downloadFile(file);
        const content = await blobToText(blob);
        const format = detectFormat(file.name);
        if (!format) {
          setError(`Unsupported subtitle format: ${file.name}`);
          return;
        }
        const track = parseSubtitleFile(
          content,
          format,
          file.name.replace(/\.[^.]+$/, ''),
          'ja'
        );
        if (track.cues.length === 0) {
          setError('The subtitle file contained no usable lines.');
          return;
        }
        track.source = 'jimaku';
        onLoadTrack(track);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load the subtitle file.');
      } finally {
        setLoading('idle');
      }
    },
    [onLoadTrack]
  );

  const downloadSubtitle = useCallback(async (file: JimakuFile) => {
    setLoading('downloading');
    setError(null);
    try {
      const blob = await clientRef.current.downloadFile(file);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download the subtitle file.');
    } finally {
      setLoading('idle');
    }
  }, []);

  // Detect anime / season / episode whenever a new video file is loaded, and
  // kick off a search when the user has already stored an API key. The
  // synchronous resets above keep the fields in sync with the loaded file.
  useEffect(() => {
    if (!videoFileName || !detected?.title) return;
    if (clientRef.current.hasApiKey) {
      void search(detected.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFileName]);

  return {
    hasApiKey,
    apiKeyInput,
    setApiKeyInput,
    saveApiKey,
    forgetApiKey,
    detected,
    query,
    setQuery,
    episode,
    setEpisode,
    entries,
    selectedEntry,
    files,
    loading,
    error,
    search,
    selectEntry,
    loadSubtitle,
    downloadSubtitle,
  };
}
