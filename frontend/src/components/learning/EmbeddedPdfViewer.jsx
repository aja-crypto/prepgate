import { useState, useRef, useCallback, useEffect } from 'react';

export default function EmbeddedPdfViewer({ url, title, onPageChange, initialPage }) {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(initialPage || 1);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [url]);

  const zoomIn = () => setZoom(z => Math.min(z + 10, 200));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const goToPage = (p) => { const pg = Math.max(1, Math.min(p, totalPages || 9999)); setCurrentPage(pg); onPageChange?.(pg); };

  return (
    <div className="w-full bg-gray-950 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
        {title && <span className="text-sm text-gray-300 truncate flex-1">{title}</span>}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <button onClick={zoomOut} className="px-2 py-1 rounded hover:bg-gray-800" title="Zoom out">−</button>
          <span className="w-10 text-center">{zoom}%</span>
          <button onClick={zoomIn} className="px-2 py-1 rounded hover:bg-gray-800" title="Zoom in">+</button>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <button onClick={() => goToPage(currentPage - 1)} className="px-2 py-1 rounded hover:bg-gray-800" disabled={currentPage <= 1}>◀</button>
          <input type="number" value={currentPage} onChange={(e) => goToPage(Number(e.target.value))} className="w-12 text-center bg-gray-800 rounded px-1 py-0.5 text-gray-200" min={1} />
          <span className="text-gray-500">/ {totalPages || '—'}</span>
          <button onClick={() => goToPage(currentPage + 1)} className="px-2 py-1 rounded hover:bg-gray-800" disabled={currentPage >= (totalPages || 9999)}>▶</button>
        </div>
        <button onClick={() => setShowSearch(s => !s)} className="px-2 py-1 text-xs rounded hover:bg-gray-800 text-gray-400">🔍</button>
        <button onClick={() => setDarkMode(d => !d)} className="px-2 py-1 text-xs rounded hover:bg-gray-800 text-gray-400">{darkMode ? '☀' : '🌙'}</button>
      </div>
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in PDF…" className="flex-1 bg-gray-800 text-sm text-gray-200 rounded-lg px-3 py-1.5 border border-gray-700 outline-none focus:border-purple-500" />
          <span className="text-xs text-gray-500">Enter to search</span>
        </div>
      )}
      <div className="relative" style={{ height: '70vh', background: darkMode ? '#0a0a0f' : '#f5f5f7' }}>
        {loading && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500"><div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />Loading PDF…</div>}
        <iframe
          ref={iframeRef}
          src={url ? `${url}#page=${currentPage}&zoom=${zoom}` : ''}
          className={`w-full h-full border-0 ${darkMode ? 'invert hue-rotate-180' : ''}`}
          title={title || 'PDF Viewer'}
          onLoad={() => { setLoading(false); try { if (iframeRef.current?.contentDocument?.querySelectorAll('.page').length) setTotalPages(iframeRef.current.contentDocument.querySelectorAll('.page').length); } catch(e) {} }}
        />
      </div>
    </div>
  );
}
