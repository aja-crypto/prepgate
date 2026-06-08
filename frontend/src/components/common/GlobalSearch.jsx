// src/components/common/GlobalSearch.jsx – Cmd+K global search
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';

const TYPE_META = {
  topic: { icon: '✅', label: 'Topic' },
  note: { icon: '📝', label: 'Note' },
  pyq: { icon: '🗂', label: 'PYQ' },
  page: { icon: '📄', label: 'Page' },
};

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { getSearchIndex } = useProgress();

  const allItems = getSearchIndex();
  const q = query.trim().toLowerCase();
  const results = q
    ? allItems.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.type.includes(q)
      ).slice(0, 12)
    : allItems.slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const goTo = (item) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[activeIdx]) goTo(results[activeIdx]);
    else if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-[70] pt-[12vh] p-4" onClick={onClose}>
      <div
        className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <span className="text-text3">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search topics, notes, PYQs..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 focus:outline-none"
          />
          <kbd className="text-[10px] text-text3 bg-bg-2 border border-white/8 px-1.5 py-0.5 rounded hidden sm:inline">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-10 text-text3 text-sm">No results for &ldquo;{query}&rdquo;</div>
          ) : results.map((item, i) => {
            const meta = TYPE_META[item.type];
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => goTo(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === activeIdx ? 'bg-primary/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text truncate">{item.title}</div>
                  <div className="text-[11px] text-text3 truncate">{item.subtitle}</div>
                </div>
                <span className="text-[10px] text-text3 uppercase tracking-wider">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-white/5 text-[10px] text-text3 flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

/** Hook to register Cmd+K / Ctrl+K shortcut */
export function useGlobalSearchShortcut(setOpen) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);
}
