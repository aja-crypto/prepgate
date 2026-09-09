// Study resources: YouTube, NPTEL, notes, textbooks, practice links
import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';

const TYPE_META = {
  youtube: { icon: '▶️', label: 'YouTube', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  nptel: { icon: '🎓', label: 'NPTEL', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  notes: { icon: '📄', label: 'Notes PDF', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  textbook: { icon: '📚', label: 'Textbook', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  gateoverflow: { icon: '💬', label: 'GateOverflow', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  practice: { icon: '📝', label: 'Practice', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};

// Recommended Educators by Subject — curated YouTube playlists per GATE subject
const EDUCATORS_BY_SUBJECT = [
  {
    subject: 'Engineering Mathematics',
    faculty: 'Gajendra Purohit',
    playlist: 'Engineering Maths for GATE',
    url: 'https://www.youtube.com/c/GajendraPurohit/playlists',
    altFaculty: 'Knowledge Gate',
    altUrl: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesSpS9N4q3q2w7tq9z3-uW5P',
  },
  {
    subject: 'Digital Logic',
    faculty: 'Neso Academy',
    playlist: 'Digital Electronics',
    url: 'https://www.youtube.com/playlist?list=PLBlnKghO6lBq-Rl_3tLYhm0LAHPHz6sU8',
    altFaculty: 'Gate Smashers',
    altUrl: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvGv_Wz7_83vGZ-H0VnFhX_',
  },
  {
    subject: 'Computer Organization',
    faculty: 'Gate Smashers',
    playlist: 'COA Full Course',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Kv-U570Q5688j_S8N60Z8-j',
    altFaculty: 'Neso Academy',
    altUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgLLlzdgiTUKULruKyQH24z',
  },
  {
    subject: 'Programming & DS',
    faculty: 'MyCodeSchool',
    playlist: 'Data Structures & Algorithms',
    url: 'https://www.youtube.com/user/mycodeschool/playlists',
    altFaculty: 'Gate Smashers',
    altUrl: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KutE8S8L6P790UvD_YI7v3a',
  },
  {
    subject: 'Algorithms',
    faculty: 'Abdul Bari',
    playlist: 'Algorithms',
    url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkfCt686D8fXm7iT68S1S',
    altFaculty: 'Gate Smashers',
    altUrl: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KiiGZ03_p-N-tH6V6L7G_5A',
  },
  {
    subject: 'Operating Systems',
    faculty: 'Neso Academy',
    playlist: 'Operating Systems',
    url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O',
    altFaculty: 'Gate Smashers',
    altUrl: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Krs7ZhSIT9-J_v8T0S_XzE_',
  },
  {
    subject: 'DBMS',
    faculty: 'Gate Smashers',
    playlist: 'DBMS Full Course',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvV_G2-0QvEclE9A_p6j0-z',
    altFaculty: 'Knowledge Gate',
    altUrl: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesR1rSES7cBQT7EJ-fWv8I-L',
  },
  {
    subject: 'Computer Networks',
    faculty: 'Gate Smashers',
    playlist: 'Computer Networks',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvMW674L_5YIuK7f6V7yVf8',
    altFaculty: 'Neso Academy',
    altUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUag00w_P_AdRUEvKzXf',
  },
  {
    subject: 'Theory of Computation',
    faculty: 'Gate Smashers',
    playlist: 'TOC Full Course',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KshS9K0vS6O0-fF9H-6q1-O',
    altFaculty: 'Neso Academy',
    altUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwMSIev',
  },
  {
    subject: 'Compiler Design',
    faculty: 'Gate Smashers',
    playlist: 'Compiler Design',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KseYAtvP6YfBOfKstf6SNoJ',
    altFaculty: 'Knowledge Gate',
    altUrl: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesRH6-W37B3-U9M59b2D_8yO',
  },
  {
    subject: 'General Aptitude',
    faculty: 'Gate Smashers',
    playlist: 'General Aptitude',
    url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvpYx8_vS2H8p8uT5vVf7Yn',
    altFaculty: 'Unacademy',
    altUrl: 'https://www.youtube.com/playlist?list=PLX2_Xf_YvU_zV0T7B9G_y9V7-fX_7Y9vO',
  },
];

export default function ResourcesPage() {
  const { resources } = useProgress();
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showEducators, setShowEducators] = useState(true);
  const { playVideo, enterPip } = useVideoPlayer();

  const subjects = ['All', ...new Set(resources.map((r) => r.subject))];
  const types = ['All', ...new Set(resources.map((r) => r.type))];

  const filtered = resources.filter(
    (r) => (filter === 'All' || r.subject === filter) && (typeFilter === 'All' || r.type === typeFilter)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Study Resources</h1>
        <p className="text-sm text-text3 mt-0.5">Curated YouTube playlists, NPTEL courses, notes & practice links</p>
      </div>

      {/* Recommended Educators by Subject Table */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowEducators(!showEducators)}
          className="text-xs text-primary hover:opacity-80 mb-3 flex items-center gap-1"
        >
          {showEducators ? '▼ Hide' : '▶ Show'} Recommended Educators by Subject
        </button>
        {showEducators && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-2">
                  <th className="text-left px-4 py-2 text-[10px] uppercase text-text3">Subject</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase text-text3">Faculty</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase text-text3">Playlist</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase text-text3">More</th>
                </tr>
              </thead>
              <tbody>
                {EDUCATORS_BY_SUBJECT.map((e, i) => (
                  <tr key={e.subject} className={`border-b border-border/50 hover:bg-hover ${i % 2 === 0 ? 'bg-bg-2/30' : ''}`}>
                    <td className="px-4 py-3 text-text font-medium">{e.subject}</td>
                    <td className="px-4 py-3 text-text2">{e.faculty}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{e.playlist}</a>
                        <button
                          type="button"
                          onClick={() => { playVideo(e.url, `${e.subject} — ${e.faculty}`); enterPip(); }}
                          className="gx-pip-trigger"
                          title="Watch in PiP"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5v-7zM4 4v6h8V4H4z"/></svg>
                          PiP
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={e.altUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{e.altFaculty}</a>
                        <button
                          type="button"
                          onClick={() => { playVideo(e.altUrl, `${e.subject} — ${e.altFaculty}`); enterPip(); }}
                          className="gx-pip-trigger"
                          title="Watch in PiP"
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5v-7zM4 4v6h8V4H4z"/></svg>
                          PiP
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {subjects.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {s === 'All' ? 'All Subjects' : s.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${typeFilter === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {t === 'All' ? 'All Types' : TYPE_META[t]?.label || t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((r) => {
          const meta = TYPE_META[r.type] || { icon: '🔗', label: r.type, color: 'text-text3 bg-bg-2 border-border' };
          const isVideo = r.type === 'youtube' || r.url?.includes('youtube.com') || r.url?.includes('youtu.be');
          return (
            <div key={r.id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text group-hover:text-primary transition-colors flex-1">{r.title}</a>
                <span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-text3">{r.subject}</div>
                {isVideo && (
                  <button
                    type="button"
                    onClick={() => { playVideo(r.url, r.title); enterPip(); }}
                    className="gx-pip-trigger"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5v-7zM4 4v6h8V4H4z"/></svg>
                    PiP
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-text3 text-sm">No resources match this filter</div>
        )}
      </div>
    </div>
  );
}
