// src/pages/VideoLecturesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = '/api/video-lectures';

export default function VideoLecturesPage() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', source: '', difficulty: '', gateRelevance: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => { loadLectures(); }, [filter, page]);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page, limit: 12, ...filter });
      const res = await axios.get(`${API}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setLectures(res.data?.data || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load lectures:', err);
      toast.error('Failed to load video lectures');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (lectureId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API}/${lectureId}/helpful`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadLectures();
      toast.success('Marked as helpful!');
    } catch (err) {
      toast.error('Failed to mark helpful');
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    const { minutes, seconds } = duration;
    return `${minutes}:${String(seconds || 0).padStart(2, '0')}`;
  };

  const subjects = ['Engineering Mathematics', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Theory of Computation', 'Compiler Design', 'Computer Organization', 'Digital Logic', 'General Aptitude'];

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-text">Video Lectures</h1>
            <p className="text-sm text-text3 mt-0.5">NPTEL, YouTube & other curated lectures</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filter.subject}
            onChange={(e) => { setFilter(f => ({ ...f, subject: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filter.source}
            onChange={(e) => { setFilter(f => ({ ...f, source: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Sources</option>
            <option value="NPTEL">NPTEL</option>
            <option value="YouTube">YouTube</option>
            <option value="Gate Wallah">Gate Wallah</option>
          </select>
          <select
            value={filter.gateRelevance}
            onChange={(e) => { setFilter(f => ({ ...f, gateRelevance: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Relevance</option>
            <option value="HIGH">High GATE Relevance</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : lectures.length === 0 ? (
        <GlassCard hover={false} padding="p-12" className="text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-text mb-2">No Lectures Found</h2>
          <p className="text-text3">Try adjusting your filters.</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {lectures.map((lecture) => (
              <GlassCard key={lecture._id} hover={false} padding="p-4">
                {/* Thumbnail */}
                <div className="relative mb-3 rounded-xl overflow-hidden bg-black/20 aspect-video flex items-center justify-center cursor-pointer" onClick={() => setSelectedVideo(lecture)}>
                  {lecture.youtubeThumbnail || lecture.thumbnailUrl ? (
                    <img src={lecture.youtubeThumbnail || lecture.thumbnailUrl} alt={lecture.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl">▶️</div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                    {formatDuration(lecture.duration)}
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase" style={{
                    background: lecture.source === 'NPTEL' ? '#e53935' : lecture.source === 'YouTube' ? '#ff0000' : '#7c4dff',
                    color: 'white',
                  }}>
                    {lecture.source}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{lecture.subject}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                        lecture.gateRelevance === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                        lecture.gateRelevance === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {lecture.gateRelevance === 'HIGH' ? '🔥 High GATE' : lecture.gateRelevance}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-text line-clamp-2 mb-1">{lecture.title}</h3>
                    {lecture.instructor?.name && (
                      <p className="text-[10px] text-text3">{lecture.instructor.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-[10px] text-text3">
                    <span>👍 {lecture.helpfulCount || 0}</span>
                    <span>👁 {lecture.viewCount || 0}</span>
                    {lecture.difficulty && <span className="capitalize">{lecture.difficulty}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleMarkHelpful(lecture._id)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-text2 text-[10px] transition-all">
                      👍 Helpful
                    </button>
                    <button onClick={() => window.open(lecture.sourceUrl, '_blank')} className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] transition-all">
                      Watch
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="max-w-4xl w-full bg-bg-1 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black">
              {selectedVideo.source === 'YouTube' && selectedVideo.sourceUrl?.includes('youtube.com') && (
                <iframe
                  src={selectedVideo.sourceUrl.replace('watch?v=', 'embed/').split('&')[0]}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-text mb-2">{selectedVideo.title}</h3>
              <div className="flex items-center gap-3 text-sm text-text3">
                <span>{selectedVideo.source}</span>
                <span>•</span>
                <span>{formatDuration(selectedVideo.duration)}</span>
                {selectedVideo.instructor?.name && <><span>•</span><span>{selectedVideo.instructor.name}</span></>}
              </div>
              {selectedVideo.description && (
                <p className="text-sm text-text2 mt-2">{selectedVideo.description}</p>
              )}
              <button onClick={() => setSelectedVideo(null)} className="mt-4 px-4 py-2 rounded-lg bg-white/[0.06] text-text2 text-sm hover:bg-white/[0.1] transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}