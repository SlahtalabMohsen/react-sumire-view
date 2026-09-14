/**
 * Client for the official Jimaku API (https://jimaku.cc/api/docs).
 *
 * - Uses only the documented REST endpoints (`/api/entries/search`,
 *   `/api/entries/{id}/files`).
 * - The user supplies their own API key, stored locally in the browser
 *   (localStorage). It is never bundled with the app and is only ever sent
 *   directly to `jimaku.cc` in the `Authorization` header.
 * - Requests run from the browser; Jimaku sends the necessary CORS headers
 *   (permissive origin reflection + `authorization` header), so no proxy or
 *   backend is required.
 */

const JIMAKU_API_BASE = 'https://jimaku.cc/api';
const API_KEY_STORAGE = 'sumire-view:jimaku-api-key';

export interface JimakuEntryFlags {
  adult?: boolean;
  anime?: boolean;
  external?: boolean;
  movie?: boolean;
  unverified?: boolean;
}

export interface JimakuEntry {
  id: number;
  /** Romaji name. */
  name: string | null;
  japanese_name: string | null;
  english_name: string | null;
  anilist_id: number | null;
  tmdb_id: string | null;
  flags: JimakuEntryFlags;
  last_modified: string;
}

export interface JimakuFile {
  url: string;
  name: string;
  size: number;
  last_modified: string;
}

export class JimakuError extends Error {
  readonly status?: number;
  readonly retryAfter?: number;

  constructor(message: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = 'JimakuError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function storeApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch {
    // Storage may be unavailable (private mode); fail silently.
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // ignore
  }
}

export class JimakuClient {
  private apiKey: string | null;
  /** Whether the key worked with a `Bearer ` prefix. */
  private useBearerPrefix = false;

  constructor(apiKey: string | null = getStoredApiKey()) {
    this.apiKey = apiKey;
  }

  setApiKey(key: string | null): void {
    this.apiKey = key ? key.trim() : null;
    this.useBearerPrefix = false;
  }

  get hasApiKey(): boolean {
    return !!this.apiKey;
  }

  private authHeader(): Record<string, string> {
    if (!this.apiKey) return {};
    return {
      Authorization: this.useBearerPrefix ? `Bearer ${this.apiKey}` : this.apiKey,
    };
  }

  /**
   * Searches Jimaku entries by fuzzy text match.
   * https://jimaku.cc/api/docs#tag/entries/operation/search_entries
   */
  async search(query: string): Promise<JimakuEntry[]> {
    const params = new URLSearchParams({
      anime: 'true',
      query,
    });
    const data = await this.request<JimakuEntry[]>(`/entries/search?${params}`);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Lists the subtitle files available for an entry, optionally filtered to a
   * best-effort episode number.
   * https://jimaku.cc/api/docs#tag/entries/operation/get_entry_files
   */
  async getFiles(entryId: number, episode?: number): Promise<JimakuFile[]> {
    const params = new URLSearchParams();
    if (episode !== undefined && episode > 0) {
      params.set('episode', String(episode));
    }
    const qs = params.toString();
    const data = await this.request<JimakuFile[]>(
      `/entries/${entryId}/files${qs ? `?${qs}` : ''}`
    );
    return Array.isArray(data) ? data : [];
  }

  /**
   * Downloads a subtitle file. Jimaku file URLs require the API key, which is
   * sent in the `Authorization` header (the CORS preflight allows it).
   */
  async downloadFile(file: JimakuFile): Promise<Blob> {
    if (!this.apiKey) {
      throw new JimakuError('A Jimaku API key is required to download files.');
    }
    let response = await fetch(file.url, { headers: this.authHeader() });

    // Retry with an explicit Bearer prefix if the raw key was rejected.
    if (response.status === 401 && !this.useBearerPrefix) {
      this.useBearerPrefix = true;
      response = await fetch(file.url, { headers: this.authHeader() });
    }

    if (!response.ok) {
      throw new JimakuError(
        `Download failed with status ${response.status}`,
        response.status
      );
    }
    return response.blob();
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.apiKey) {
      throw new JimakuError(
        'No Jimaku API key set. Add your key to search and download subtitles.'
      );
    }

    let response = await fetch(`${JIMAKU_API_BASE}${path}`, {
      headers: this.authHeader(),
    });

    if (response.status === 401 && !this.useBearerPrefix) {
      // Retry once with an explicit Bearer prefix.
      this.useBearerPrefix = true;
      response = await fetch(`${JIMAKU_API_BASE}${path}`, {
        headers: this.authHeader(),
      });
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('x-ratelimit-reset-after');
      throw new JimakuError(
        'Jimaku rate limit reached. Please wait a moment and try again.',
        429,
        retryAfter ? parseFloat(retryAfter) : undefined
      );
    }

    if (response.status === 401) {
      throw new JimakuError(
        'Jimaku rejected the API key. Check that it is correct on your account page.'
      );
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        (body as { error?: string } | null)?.error ??
        `Jimaku request failed (${response.status})`;
      throw new JimakuError(message, response.status);
    }

    return response.json() as Promise<T>;
  }
}

/**
 * Guesses which file in an entry best matches the requested episode, using the
 * same episode patterns as the filename parser.
 */
export function rankEpisodeFiles(
  files: JimakuFile[],
  episode?: number
): JimakuFile[] {
  if (episode === undefined) return files;
  const target = String(episode);

  const scored = files.map(file => {
    const base = file.name.replace(/\.[^.]+$/, '');
    let score = 0;
    // Exact "E03"/"- 03"/"第3話" style match against the target episode.
    if (new RegExp(`(^|[^0-9])0?${target}([^0-9]|$)`).test(base)) score += 2;
    // Prefer Japanese subtitle formats.
    if (/\.srt$/i.test(file.name)) score += 1;
    if (/\.ass$/i.test(file.name)) score += 1;
    // Penalise obvious multi-episode packs for a specific-episode lookup.
    if (/[-&~_,]/.test(base) && /\d/.test(base)) score -= 1;
    return { file, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.file.size - b.file.size)
    .map(s => s.file);
}
