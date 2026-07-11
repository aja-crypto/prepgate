import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;

export default function PremiumPdfViewer({ url, fileName, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIdx, setCurrentSearchIdx] = useState(-1);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);

  const containerRef = useRef(null);
  const pagesRef = useRef({});
  const searchTimeoutRef = useRef(null);
  const pdfRef = useRef(null);

  const loadedPdfRef = useRef(null);

  const onDocumentLoadSuccess = useCallback((pdf) => {
    pdfRef.current = pdf;
    loadedPdfRef.current = pdf;
    setNumPages(pdf.numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setError(err.message || 'Failed to load PDF');
    setLoading(false);
  }, []);

  const zoomIn = useCallback(() => {
    setScale(s => {
      const next = ZOOM_STEPS.find(z => z > s);
      return next || s;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => {
      const next = [...ZOOM_STEPS].reverse().find(z => z < s);
      return next || s;
    });
  }, []);

  const zoomTo = useCallback((z) => {
    setScale(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)));
  }, []);

  const goToPage = useCallback((n) => {
    const p = Math.max(1, Math.min(n, numPages || 1));
    setPageNumber(p);
  }, [numPages]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomTo(scale + delta);
    }
  }, [scale, zoomTo]);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); goToPage(pageNumber + 1); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); goToPage(pageNumber - 1); break;
      case 'PageDown': e.preventDefault(); goToPage(pageNumber + 1); break;
      case 'PageUp': e.preventDefault(); goToPage(pageNumber - 1); break;
      case 'Home': e.preventDefault(); goToPage(1); break;
      case 'End': e.preventDefault(); goToPage(numPages || 1); break;
      case 'Escape': if (showSearch) setShowSearch(false); else onClose?.(); break;
      case 'f': if (e.ctrlKey) { e.preventDefault(); setShowSearch(s => !s); } break;
    }
  }, [pageNumber, numPages, zoomIn, zoomOut, goToPage, showSearch, onClose]);

  const searchInPdf = useCallback(async (query) => {
    if (!query.trim() || !pdfRef.current) {
      setSearchResults([]);
      setCurrentSearchIdx(-1);
      return;
    }
    const results = [];
    for (let i = 1; i <= pdfRef.current.numPages; i++) {
      const page = await pdfRef.current.getPage(i);
      const text = await page.getTextContent();
      const items = text.items.filter(item => item.str.toLowerCase().includes(query.toLowerCase()));
      if (items.length > 0) {
        results.push({ page: i, count: items.length, items });
      }
    }
    setSearchResults(results);
    setCurrentSearchIdx(results.length > 0 ? 0 : -1);
    if (results.length > 0) goToPage(results[0].page);
  }, [goToPage]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchInPdf(searchQuery), 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, searchInPdf]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const visiblePages = useMemo(() => {
    if (!numPages) return [];
    const range = 2;
    const start = Math.max(1, pageNumber - range);
    const end = Math.min(numPages, pageNumber + range);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [numPages, pageNumber]);

  const thumbPages = useMemo(() => {
    if (!numPages) return [];
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [numPages]);

  const searchResultCount = searchResults.reduce((s, r) => s + r.count, 0);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0f] select-none" ref={containerRef} onWheel={handleWheel}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#12121a]/95 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text3 hover:text-white hover:bg-white/5 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Back
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <span className="text-xs text-text2 truncate max-w-[200px] sm:max-w-[300px]">{fileName || 'PDF Viewer'}</span>

        <div className="flex-1" />

        {numPages && (
          <div className="flex items-center gap-1 text-xs text-text3">
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={e => goToPage(parseInt(e.target.value) || 1)}
              className="w-10 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-center text-white text-xs focus:outline-none focus:border-purple-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span>/ {numPages}</span>
          </div>
        )}

        <div className="w-px h-5 bg-white/10 mx-1" />

        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} className="p-1.5 rounded-lg text-text3 hover:text-white hover:bg-white/5 transition-colors" title="Zoom out"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
          <span className="text-xs text-text3 w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 rounded-lg text-text3 hover:text-white hover:bg-white/5 transition-colors" title="Zoom in"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
        </div>

        <button onClick={() => zoomTo(1)} className="p-1.5 rounded-lg text-xs text-text3 hover:text-white hover:bg-white/5 transition-colors" title="Reset zoom to 100%">{Math.round(scale * 100)}%</button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button onClick={() => setShowThumbnails(s => !s)} className={`p-1.5 rounded-lg transition-colors ${showThumbnails ? 'text-purple-400 bg-purple-500/10' : 'text-text3 hover:text-white hover:bg-white/5'}`} title="Thumbnails">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 4h4v4H4V4zm0 8h4v4H4v-4zm8-8h4v4h-4V4zm0 8h4v4h-4v-4z" /></svg>
        </button>

        <button onClick={() => setShowSearch(s => !s)} className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'text-purple-400 bg-purple-500/10' : 'text-text3 hover:text-white hover:bg-white/5'}`} title="Search (Ctrl+F)">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        </button>

        <a href={url} download className="p-1.5 rounded-lg text-text3 hover:text-white hover:bg-white/5 transition-colors" title="Download">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </a>

        <button onClick={() => window.print()} className="p-1.5 rounded-lg text-text3 hover:text-white hover:bg-white/5 transition-colors" title="Print">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
        </button>

        <button onClick={toggleFullscreen} className={`p-1.5 rounded-lg transition-colors ${isFullscreen ? 'text-purple-400 bg-purple-500/10' : 'text-text3 hover:text-white hover:bg-white/5'}`} title="Fullscreen">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#16161f] border-b border-white/[0.06]">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-text3 shrink-0"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in PDF..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-text3 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <span className="text-xs text-text3">
              {searchResultCount > 0 ? `${currentSearchIdx + 1}/${searchResultCount}` : 'No results'}
            </span>
          )}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={() => { const i = Math.max(0, currentSearchIdx - 1); setCurrentSearchIdx(i); goToPage(searchResults[i]?.page || 1); }} className="p-1 rounded text-text3 hover:text-white hover:bg-white/5"><svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
              <button onClick={() => { const i = Math.min(searchResults.length - 1, currentSearchIdx + 1); setCurrentSearchIdx(i); goToPage(searchResults[i]?.page || 1); }} className="p-1 rounded text-text3 hover:text-white hover:bg-white/5"><svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
            </div>
          )}
          <button onClick={() => { setSearchQuery(''); setSearchResults([]); setCurrentSearchIdx(-1); }} className="p-1 rounded text-text3 hover:text-white hover:bg-white/5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails sidebar */}
        {showThumbnails && numPages && !loading && (
          <div className="w-36 sm:w-44 lg:w-52 bg-[#0e0e16] border-r border-white/[0.06] overflow-y-auto shrink-0 hidden sm:block">
            <div className="p-2.5 space-y-2">
              {thumbPages.map(p => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-full rounded-lg overflow-hidden border transition-all ${p === pageNumber ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-white/[0.06] hover:border-white/20'}`}
                >
                  <div className="bg-white/[0.02] aspect-[3/4] flex items-center justify-center">
                    <Page
                      key={`thumb-${p}`}
                      pageNumber={p}
                      width={120}
                      pdf={loadedPdfRef.current}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<div className="w-full h-full bg-white/[0.02] animate-pulse" />}
                    />
                  </div>
                  <div className="text-[10px] text-text3 text-center py-1 bg-white/[0.02]">{p}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDF pages area */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0f]" ref={containerRef}>
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300" style={{ width: `${loadProgress}%` }} />
              </div>
              <div className="text-xs text-text3">Loading PDF... {Math.round(loadProgress)}%</div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-400"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-sm text-text3">Failed to load PDF</p>
              <p className="text-xs text-text3/60">{error}</p>
              <button onClick={onClose} className="mt-2 text-xs px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors">Close</button>
            </div>
          )}

          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onProgress={({ loaded, total }) => setLoadProgress((loaded / total) * 100)}
            loading={null}
          >
            <div className="flex flex-col items-center py-4 sm:py-6 gap-3 sm:gap-4 min-h-full">
              {visiblePages.map(p => (
                <div
                  key={p}
                  id={`page-${p}`}
                  ref={el => pagesRef.current[p] = el}
                  className="shadow-2xl shadow-black/40 rounded-sm overflow-hidden"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
                >
                  <Page
                    pageNumber={p}
                    width={Math.min(900, typeof window !== 'undefined' ? window.innerWidth * 0.7 : 700)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="bg-white/[0.02] animate-pulse" style={{ width: 600, height: 800 }}>
                        <div className="p-6 space-y-3">
                          <div className="h-3 bg-white/5 rounded w-3/4" />
                          <div className="h-3 bg-white/5 rounded" />
                          <div className="h-3 bg-white/5 rounded w-5/6" />
                          <div className="h-3 bg-white/5 rounded w-2/3" />
                          <div className="h-3 bg-white/5 rounded w-4/5" />
                          <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>

      {/* Mobile bottom toolbar */}
      <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-[#12121a]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <button onClick={() => goToPage(pageNumber - 1)} className="p-2 rounded-lg text-text3 hover:text-white disabled:opacity-30" disabled={pageNumber <= 1}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <span className="text-xs text-text3">{pageNumber}/{numPages}</span>
        <button onClick={() => goToPage(pageNumber + 1)} className="p-2 rounded-lg text-text3 hover:text-white disabled:opacity-30" disabled={pageNumber >= (numPages || 1)}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="w-px h-5 bg-white/10" />
        <button onClick={zoomOut} className="p-2 rounded-lg text-text3 hover:text-white"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
        <span className="text-xs text-text3 w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="p-2 rounded-lg text-text3 hover:text-white"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
      </div>
    </div>
  );
}
