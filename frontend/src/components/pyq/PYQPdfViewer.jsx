import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, Search, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function PYQPdfViewer({ subject, pdfUrl, startPage, endPage, onBack }) {
  const [pageNum, setPageNum] = useState(startPage);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  const totalSubjectPages = endPage - startPage + 1;

  // Reset when subject changes
  useEffect(() => {
    setPageNum(startPage);
    setLoading(true);
  }, [startPage]);

  // PDF URL with page anchor for most PDF viewers
  const pdfSrc = `${pdfUrl}#page=${pageNum}`;

  const goPrev = useCallback(() => {
    if (pageNum > startPage) setPageNum(p => p - 1);
  }, [pageNum, startPage]);

  const goNext = useCallback(() => {
    if (pageNum < endPage) setPageNum(p => p + 1);
  }, [pageNum, endPage]);

  const handleFullscreen = useCallback(() => {
    if (!fullscreen) {
      const el = document.getElementById('pyq-pdf-viewer');
      if (el?.requestFullscreen) el.requestFullscreen();
    } else {
      if (document.fullscreenElement) document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Jump to page
  const jumpToPage = useCallback((val) => {
    const p = parseInt(val, 10);
    if (isNaN(p)) return;
    setPageNum(Math.max(startPage, Math.min(endPage, p)));
  }, [startPage, endPage]);

  return (
    <div id="pyq-pdf-viewer" className="flex flex-col h-full min-h-[70vh]">
      {/* Toolbar */}
      <GlassCard padding="p-3" className="mb-3 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-bg-2 text-text3 hover:text-text transition-colors" title="Back to subjects">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h3 className="text-sm font-bold text-text">{subject.label}</h3>
              <p className="text-[10px] text-text3">
                Page {pageNum}–{endPage} · {totalSubjectPages} pages · {subject.short}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Jump to page */}
            <div className="flex items-center gap-1 bg-bg-2 border border-border rounded-lg px-2 py-1">
              <input
                type="number"
                min={startPage}
                max={endPage}
                value={pageNum}
                onChange={e => jumpToPage(e.target.value)}
                className="w-14 bg-transparent text-xs text-text text-center outline-none no-spinner"
              />
              <span className="text-[10px] text-text3">/ {endPage}</span>
            </div>

            {/* Prev / Next */}
            <button onClick={goPrev} disabled={pageNum <= startPage} className="p-1.5 rounded-lg hover:bg-bg-2 text-text3 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goNext} disabled={pageNum >= endPage} className="p-1.5 rounded-lg hover:bg-bg-2 text-text3 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Search */}
            <div className="relative">
              <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded-lg hover:bg-bg-2 text-text3 hover:text-text transition-colors" title="Search within subject">
                <Search size={16} />
              </button>
              {showSearch && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-surface border border-border rounded-xl p-3 shadow-xl min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={14} className="text-text3" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search text (browser Ctrl+F)..."
                      className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text outline-none"
                    />
                    <button onClick={() => setShowSearch(false)} className="text-text3 hover:text-text">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] text-text3">Press Ctrl+F in the PDF viewer below for native search.</p>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="p-1.5 rounded-lg hover:bg-bg-2 text-text3 hover:text-text transition-colors" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Download */}
            <a
              href={pdfUrl}
              download
              className="p-1.5 rounded-lg hover:bg-bg-2 text-text3 hover:text-text transition-colors"
              title="Download full PDF"
            >
              <Download size={16} />
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Loading indicator */}
      {loading && (
        <div className="flex-1 flex items-center justify-center bg-bg-2 border border-border rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-text3">Loading page {pageNum}...</p>
          </div>
        </div>
      )}

      {/* PDF iframe — loads only the current page range */}
      <div className={`flex-1 rounded-xl overflow-hidden border border-border bg-white ${loading ? 'hidden' : 'block'}`}>
        <iframe
          ref={iframeRef}
          src={pdfSrc}
          className="w-full h-full"
          title={`${subject.label} - Page ${pageNum}`}
          onLoad={() => setLoading(false)}
          style={{ minHeight: '60vh' }}
        />
      </div>
    </div>
  );
}
