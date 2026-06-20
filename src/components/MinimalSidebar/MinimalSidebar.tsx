import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../Tooltip/Tooltip';
import './MinimalSidebar.css';

type TabId = 'subtitles' | 'bookmarks' | 'comments' | 'vocabulary' | 'log';

interface MinimalSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  children: ReactNode;
  vocabularyCount?: number;
}

const TABS: { id: TabId; label: string; svg: string }[] = [
  {
    id: 'subtitles',
    label: 'Subtitles',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  },
  {
    id: 'log',
    label: 'Dialogue Log',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  },
  {
    id: 'comments',
    label: 'Comments',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
];

export function MinimalSidebar({
  activeTab,
  onTabChange,
  isExpanded,
  onToggleExpand,
  children,
  vocabularyCount = 0,
}: MinimalSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleTabClick = useCallback(
    (tabId: TabId) => {
      if (isExpanded && activeTab === tabId) {
        onToggleExpand();
      } else {
        onTabChange(tabId);
        if (!isExpanded) onToggleExpand();
      }
    },
    [isExpanded, activeTab, onTabChange, onToggleExpand]
  );

  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onToggleExpand();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, onToggleExpand]);

  return (
    <div
      ref={panelRef}
      className={`minimal-sidebar ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="sidebar-rail">
        {TABS.map(tab => (
          <Tooltip key={tab.id} content={tab.label} side="left">
            <button
              className={`rail-btn ${activeTab === tab.id && isExpanded ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title=""
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={tab.label}
            >
              <span
                className="rail-icon"
                dangerouslySetInnerHTML={{ __html: tab.svg }}
              />
              {tab.id === 'vocabulary' && vocabularyCount > 0 && (
                <span className="rail-badge">{vocabularyCount}</span>
              )}
            </button>
          </Tooltip>
        ))}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="sidebar-panel-content"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="panel-header">
              <span className="panel-title">
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
              <button className="panel-close" onClick={onToggleExpand} aria-label="Close panel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="panel-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
