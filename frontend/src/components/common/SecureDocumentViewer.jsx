import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FIT_MODES = {
  FIT_WIDTH: 'width',
  FIT_PAGE: 'page',
};

const watermarkStyle = {
  position: 'absolute',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 10,
  fontFamily: 'monospace',
  opacity: 0.35,
  textShadow: '0 0 4px rgba(0,0,0,0.5)',
};

export default function SecureDocumentViewer({ pdfId, onClose }) {
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [fitMode, setFitMode] = useState(FIT_MODES.FIT_WIDTH);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/protected/pdf/${pdfId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load document');
      setDoc(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pdfId]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  useEffect(() => {
    if (doc?.pages?.length) {
      setPageLoading(true);
      const img = new Image();
      img.onload = () => setPageLoading(false);
      img.onerror = () => setPageLoading(false);
      img.src = doc.pages[currentPage - 1]?.url;
      // timeout fallback
      setTimeout(() => setPageLoading(false), 3000);
    }
  }, [currentPage, doc]);

  const goToPage = (p) => {
    if (p >= 1 && p <= (doc?.totalPages || 1)) {
      setCurrentPage(p);
      if (viewerRef.current) viewerRef.current.scrollTop = 0;
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (['s', 'p', 'S', 'P'].includes(e.key)) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPage(currentPage - 1);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') goToPage(currentPage + 1);
    if (e.key === 'Escape' && onClose) onClose();
  }, [currentPage, doc]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-text3">Loading secure document...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-3xl mb-3">&#128274;</div>
          <div className="text-sm text-red-400 mb-2">{error}</div>
          <button onClick={onClose || (() => navigate(-1))} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const currentPageUrl = doc.pages[currentPage - 1]?.url;
  const totalPages = doc.totalPages;
  const fitScale = fitMode === FIT_MODES.FIT_PAGE ? 'contain' : 'contain';

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/98 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0 bg-black/80 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose || (() => navigate(-1))}
            className="text-text3 hover:text-text transition-colors p-1.5"
            title="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-text truncate">{doc.title}</h1>
            <p className="text-[10px] text-text3 truncate">
              {doc.subject && `${doc.subject} `}
              {doc.category && `· ${doc.category} `}
              {doc.year && `· ${doc.year}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="text-text3 hover:text-text transition-colors p-1.5" title="Zoom out">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
          <span className="text-[11px] text-text3 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="text-text3 hover:text-text transition-colors p-1.5" title="Zoom in">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Fit mode */}
          <button onClick={() => setFitMode(f => f === FIT_MODES.FIT_WIDTH ? FIT_MODES.FIT_PAGE : FIT_MODES.FIT_WIDTH)} className={`text-[11px] px-2 py-1 rounded transition-colors ${fitMode === FIT_MODES.FIT_WIDTH ? 'bg-primary/20 text-primary' : 'text-text3 hover:text-text'}`} title="Toggle fit mode">
            {fitMode === FIT_MODES.FIT_WIDTH ? 'W' : 'P'}
          </button>
        </div>
      </div>

      {/* Page display area */}
      <div
        ref={viewerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-4"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="relative inline-flex" style={{ touchAction: 'none' }}>
          {pageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}>
            {currentPageUrl && (
              <img
                src={currentPageUrl}
                alt={`Page ${currentPage}`}
                className="max-w-none rounded shadow-2xl"
                style={{
                  maxWidth: fitMode === FIT_MODES.FIT_WIDTH ? 'min(100vw - 48px, 1400px)' : undefined,
                  maxHeight: fitMode === FIT_MODES.FIT_PAGE ? 'min(calc(100vh - 120px), 1200px)' : undefined,
                  objectFit: fitScale,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
                }}
                draggable={false}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-3 h-12 shrink-0 bg-black/80 border-t border-white/5">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-text3 hover:text-text disabled:opacity-30 transition-all p-1.5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            min={1}
            max={totalPages}
            className="w-10 text-center bg-white/5 border border-white/10 rounded text-xs text-text py-1 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[11px] text-text3">/ {totalPages}</span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="text-text3 hover:text-text disabled:opacity-30 transition-all p-1.5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
}
