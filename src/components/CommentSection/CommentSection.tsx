import { useCallback, useState } from 'react';
import type { Comment } from '../../types';
import { formatTime } from '../../utils/time';
import './CommentSection.css';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (comment: Comment) => void;
  onSeek: (time: number) => void;
  currentTime: number;
}

export function CommentSection({ comments, onAddComment, onSeek, currentTime }: CommentSectionProps) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(() => {
    return localStorage.getItem('sv-username') || '';
  });

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    const name = author.trim() || 'Anonymous';
    localStorage.setItem('sv-username', name);

    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      author: name,
      text: text.trim(),
      timestamp: currentTime,
      createdAt: Date.now(),
    };
    onAddComment(comment);
    setText('');
  }, [text, author, currentTime, onAddComment]);

  const sorted = [...comments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="comment-section">
      <h3 className="comment-title">Comments ({comments.length})</h3>

      <div className="comment-form">
        <input
          type="text"
          className="comment-author"
          placeholder="Your name"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <div className="comment-form-row">
          <textarea
            className="comment-textarea"
            placeholder={`Comment at ${formatTime(currentTime)}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            rows={2}
          />
        </div>
        <div className="comment-form-actions">
          <span className="comment-timestamp">
            📍 {formatTime(currentTime)}
          </span>
          <button
            className="comment-submit"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Post Comment
          </button>
        </div>
      </div>

      <div className="comment-list">
        {sorted.length === 0 ? (
          <div className="comment-empty">
            <p>No comments yet</p>
            <p className="comment-empty-hint">Be the first to comment!</p>
          </div>
        ) : (
          sorted.map(cmt => (
            <div key={cmt.id} className="comment-item">
              <div className="comment-avatar">
                {cmt.author.charAt(0).toUpperCase()}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-name">{cmt.author}</span>
                  <button
                    className="comment-time-link"
                    onClick={() => onSeek(cmt.timestamp)}
                    title="Jump to timestamp"
                    aria-label={`Jump to ${formatTime(cmt.timestamp)}`}
                  >
                    {formatTime(cmt.timestamp)}
                  </button>
                </div>
                <div className="comment-text">{cmt.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
