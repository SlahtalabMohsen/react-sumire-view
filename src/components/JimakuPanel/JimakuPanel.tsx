import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseJimakuResult } from '../../hooks/useJimaku';
import type { JimakuEntry } from '../../services/jimaku';
import { formatBytes } from '../../utils/format';
import './JimakuPanel.css';

type JimakuPanelProps = UseJimakuResult;

function entryDisplayName(entry: JimakuEntry): string {
  return entry.japanese_name || entry.name || entry.english_name || `Entry #${entry.id}`;
}

export const JimakuPanel = memo(function JimakuPanel(props: JimakuPanelProps) {
  const {
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
  } = props;

  const [showKey, setShowKey] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void search(query);
  };

  return (
    <div className="jm-section">
      <div className="jm-header">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span className="jm-title">Jimaku 字幕検索</span>
      </div>

      {/* --- API key --- */}
      <div className="jm-key-row">
        <input
          className="jm-key-input"
          type={showKey ? 'text' : 'password'}
          value={apiKeyInput}
          onChange={e => setApiKeyInput(e.target.value)}
          placeholder={hasApiKey ? '•••••••••••• (saved)' : 'Jimaku API key'}
          aria-label="Jimaku API key"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="jm-btn primary"
          onClick={saveApiKey}
          disabled={!apiKeyInput.trim()}
        >
          Save
        </button>
      </div>
      <div className="jm-key-meta">
        <button
          className="jm-link"
          onClick={() => setShowKey(prev => !prev)}
          type="button"
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
        {hasApiKey && (
          <button className="jm-link" onClick={forgetApiKey} type="button">
            Forget
          </button>
        )}
        <a
          className="jm-link"
          href="https://jimaku.cc/account"
          target="_blank"
          rel="noopener noreferrer"
        >
          How to get an API key?
        </a>
      </div>
      <p className="jm-note">
        Your key is stored only in this browser and sent directly to{' '}
        <code>jimaku.cc</code> — it is never bundled with Sumire View or sent
        anywhere else.
      </p>

      {/* --- Search --- */}
      <form className="jm-search-row" onSubmit={handleSearch}>
        <input
          className="jm-search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Anime title (editable)"
          aria-label="Anime title"
          spellCheck={false}
        />
        <input
          className="jm-episode-input"
          type="number"
          min={1}
          max={999}
          value={episode ?? ''}
          onChange={e => {
            const value = e.target.value;
            setEpisode(value === '' ? undefined : Math.max(1, parseInt(value, 10) || 1));
          }}
          aria-label="Episode number"
          title="Episode number"
        />
        <button
          className="jm-btn primary"
          type="submit"
          disabled={loading === 'searching' || !query.trim()}
        >
          {loading === 'searching' ? '…' : 'Search'}
        </button>
      </form>

      {detected && (
        <p className="jm-detected">
          Detected: <strong>{detected.title || '—'}</strong>
          {detected.season !== undefined && ` · S${detected.season}`}
          {detected.episode !== undefined && ` · Ep ${detected.episode}`}
          {detected.episode === undefined && ' · episode unknown'}
        </p>
      )}

      {error && <div className="jm-error">{error}</div>}

      {/* --- Results --- */}
      <AnimatePresence>
        {entries.length > 0 && (
          <motion.div
            className="jm-list"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div className="jm-list-label">
              {selectedEntry ? 'Selected anime' : `${entries.length} match${entries.length === 1 ? '' : 'es'}`}
            </div>
            {entries.map(entry => (
              <button
                key={entry.id}
                className={`jm-entry ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                onClick={() => selectEntry(entry)}
                disabled={loading === 'files'}
              >
                <span className="jm-entry-name">{entryDisplayName(entry)}</span>
                {entry.english_name && entry.japanese_name && (
                  <span className="jm-entry-sub">{entry.english_name}</span>
                )}
                {entry.flags.movie && <span className="jm-tag">Movie</span>}
                {entry.flags.adult && <span className="jm-tag warn">18+</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Files --- */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="jm-list"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <div className="jm-list-label">
              Japanese subtitles · {files.length} file{files.length === 1 ? '' : 's'}
            </div>
            {files.map((file, index) => (
              <div key={file.url} className="jm-file">
                <div className="jm-file-info">
                  <span className="jm-file-name" title={file.name}>{file.name}</span>
                  <span className="jm-file-meta">
                    {index === 0 && episode !== undefined ? 'best match · ' : ''}
                    {formatBytes(file.size)}
                  </span>
                </div>
                <div className="jm-file-actions">
                  <button
                    className="jm-btn small primary"
                    onClick={() => loadSubtitle(file)}
                    disabled={loading === 'downloading'}
                    title="Load this subtitle into Sumire View"
                  >
                    Load
                  </button>
                  <button
                    className="jm-btn small"
                    onClick={() => downloadSubtitle(file)}
                    disabled={loading === 'downloading'}
                    title="Download this subtitle to your device"
                  >
                    ⤓
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {loading === 'files' && <div className="jm-hint">Fetching subtitle files…</div>}
      {loading === 'downloading' && <div className="jm-hint">Downloading…</div>}
    </div>
  );
});
