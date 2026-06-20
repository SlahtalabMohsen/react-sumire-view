import type { VocabularyWord } from '../../types';
import { formatTime } from '../../utils/time';

interface VocabularyListProps {
  words: VocabularyWord[];
  onRemove: (id: string) => void;
  onSeek: (time: number) => void;
}

export function VocabularyList({ words, onRemove, onSeek }: VocabularyListProps) {
  const sorted = [...words].sort((a, b) => b.createdAt - a.createdAt);

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          まだ単語がありません
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Click on subtitle text to save words
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map(word => (
        <div
          key={word.id}
          className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
          style={{ background: 'var(--surface-secondary)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className="text-base font-medium"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-jp)',
                }}
              >
                {word.word}
              </span>
              {word.reading && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jp)' }}
                >
                  {word.reading}
                </span>
              )}
            </div>
            {word.meaning && (
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {word.meaning}
              </p>
            )}
            {word.sentence && (
              <p
                className="text-xs mt-1 leading-relaxed italic"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-jp)',
                }}
              >
                {word.sentence}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="px-1.5 py-0.5 text-xs rounded-md transition-colors opacity-0 group-hover:opacity-100"
              style={{
                color: 'var(--accent)',
                background: 'var(--accent-soft)',
              }}
              onClick={() => onSeek(word.timestamp)}
              title={`Jump to ${formatTime(word.timestamp)}`}
            >
              {formatTime(word.timestamp)}
            </button>
            <button
              className="w-5 h-5 flex items-center justify-center rounded text-xs opacity-0 group-hover:opacity-100 transition-all"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => onRemove(word.id)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
