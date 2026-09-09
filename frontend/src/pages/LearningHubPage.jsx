import { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import api from '../services/api';

const SUBJECTS = ['All','Engineering Mathematics','Digital Logic','COA','Programming & DS','Algorithms','OS','DBMS','CN','TOC','CD','Aptitude'];

export default function LearningHubPage() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All');
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const abortRef = useRef(null);
  const { playVideo, enterPip } = useVideoPlayer();

  useEffect(() => {
    const t = setTimeout(() => setQuery(inputValue.trim()), 350);
    return () => clearTimeout(t);
  }, [inputValue]);

  const fetchVideos = useCallback(async (p, q, subj, signal) => {
    setVideosLoading(true); setVideosError(null);
    try {
      const params = { page: p, limit: pageSize };
      if (subj !== 'All') params.subject = subj;
      if (q) params.search = q;
      const res = await api.get('/learning-hub/videos', { params, signal, timeout: 8000 }).catch((e) => {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') throw e;
        if (e?.response?.status === 404) throw e;
        return api.get('/resources/videos', { params, signal, timeout: 8000 });
      });
      if (signal?.aborted) return;
      const list = res?.data?.data || res?.data || [];
      const arr = Array.isArray(list) ? list : (list.items || list.videos || []);
      setVideos(arr);
    } catch (e) {
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || signal?.aborted) return;
      const msg = e?.response?.data?.message;
      if (e?.response?.status === 404) {
        setVideos([]);
        setVideosError(null);
        return;
      }
      setVideosError(msg || 'Unable to load videos');
    } finally {
      if (!signal?.aborted) setVideosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchVideos(page, query, subject, controller.signal);
    return () => controller.abort();
  }, [fetchVideos, page, query, subject]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Learning Hub</h1>
        <p className="text-sm text-text3 mt-0.5">Curated videos and editor picks for GATE 2027</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Search videos, topics..." className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40" />
          <div className="flex gap-1.5 flex-wrap">
            {SUBJECTS.slice(0,8).map(s => (
              <button key={s} onClick={() => { setSubject(s); setPage(1); }} className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${subject===s?'bg-primary/15 border-primary/30 text-primary':'bg-bg-2 border-border text-text3'}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Videos</h2>
        <span className="text-xs text-text3">{videosLoading ? 'Loading...' : `${videos.length} items`}</span>
      </div>

      {videosLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({length:6}).map((_,i) => <div key={i} className="h-44 bg-surface border border-border rounded-xl animate-pulse" />)}
        </div>
      )}
      {videosError && !videosLoading && (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-text2 mb-3">{videosError}</p>
          <button onClick={() => { if (abortRef.current) abortRef.current.abort(); const c = new AbortController(); abortRef.current = c; fetchVideos(page, query, subject, c.signal); }} className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}
      {!videosLoading && !videosError && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {videos.map((v,i) => (
              <div key={v._id||v.id||i} className="bg-surface border border-border rounded-xl overflow-hidden hover:border-white/10">
                <div className="h-24 bg-bg-2 flex items-center justify-center text-text3 text-xs">Thumbnail</div>
                <div className="p-3">
                  <div className="text-sm font-medium text-text line-clamp-2">{v.title || v.name || 'Video'}</div>
                  <div className="text-[11px] text-text3 mt-1">{v.subject || v.channel || ''}</div>
                  <button onClick={() => { if(v.url) { playVideo(v.url, v.title); enterPip(); } else window.open(v.url||'#','_blank'); }} className="mt-2 text-xs text-primary hover:underline">Watch →</button>
                </div>
              </div>
            ))}
            {videos.length===0 && <div className="col-span-3 text-center py-12 text-sm text-text3">No videos found. Try another filter.</div>}
          </div>
          <div className="flex gap-2 justify-center mt-5">
            <button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} className="btn-ghost text-xs disabled:opacity-40">Previous</button>
            <span className="text-xs text-text3 py-2">Page {page}</span>
            <button onClick={() => setPage(p=>p+1)} className="btn-ghost text-xs">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
