import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, Video, Tv, BrainCircuit, X, ArrowRight, Sparkles } from 'lucide-react';
import { parseAiQuery, describeAiQuery, weightageOf } from '../../utils/aiQuery';

// Central search interaction: Cmd/Ctrl+K focus, instant grouped suggestions
// across Videos, Creators, Subjects and Topics, plus AI natural-language intent.
export default function SmartSearch({ videos, topics, onSearch, value, onChange, onSelectVideo, onApplyAi }) {
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === 'Escape') {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = (value || '').trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!q) return { videos: [], creators: [], subjects: [], topics: [] };
    const videoMatches = videos
      .filter((v) =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.channel || '').toLowerCase().includes(q) ||
        (v.tags || []).some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 5);
    const creators = [...new Set(
      videos.filter((v) => v.channel && v.channel !== 'Unknown' && v.channel.toLowerCase().includes(q)).map((v) => v.channel)
    )].slice(0, 3);
    const subjects = [
      'Operating Systems', 'Computer Networks', 'DBMS', 'Computer Organization',
      'Theory of Computation', 'Compiler Design', 'Algorithms', 'Programming & Data Structures',
      'Engineering Mathematics', 'Digital Logic', 'General Aptitude',
    ].filter((s) => s.toLowerCase().includes(q));
    const topicMatches = (topics || [])
      .filter((t) => (t.name || '').toLowerCase().includes(q))
      .slice(0, 4);
    return { videos: videoMatches, creators, subjects, topics: topicMatches };
  }, [q, videos, topics]);

  const total = suggestions.videos.length + suggestions.creators.length + suggestions.subjects.length + suggestions.topics.length;
  const showSuggestions = focused && q && total > 0;

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl opacity-60 pointer-events-none transition-opacity"
          style={{ boxShadow: focused ? '0 0 40px rgba(139,92,246,0.22)' : '0 0 20px rgba(139,92,246,0.08)' }} />
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
          style={{
            background: 'rgba(18,24,40,0.85)',
            border: focused ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 12px 40px -12px rgba(139,92,246,0.35)' : 'none',
          }}>
          <Search className="w-4 h-4 text-text3/60 shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); setFocused(true); }}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.videos[0]) {
                onSelectVideo?.(suggestions.videos[0]);
                setFocused(false);
              }
            }}
            placeholder="Search videos, notes, channels, topics..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-text3/40 focus:outline-none"
          />
          {value ? (
            <button onClick={() => { onChange(''); inputRef.current?.focus(); }} className="text-text3/50 hover:text-white transition-colors p-1" aria-label="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 text-[10px] text-text3/50"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Command className="w-3 h-3" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-40"
          style={{ background: 'rgba(15,17,25,0.96)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)' }}>
          <div className="max-h-[60vh] overflow-y-auto scroll-container p-2 space-y-1">
            {suggestions.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text3/50">
                  <Video className="w-3 h-3" /> Videos
                </div>
                {suggestions.videos.map((v) => (
                  <button key={v._id || v.id} onClick={() => { onSelectVideo?.(v); setFocused(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                    <span className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black/40">
                      <img src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-white truncate">{v.title}</span>
                      <span className="block text-[10px] text-text3/60 truncate">{v.channel || '—'}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text3/30 shrink-0 ml-auto" />
                  </button>
                ))}
              </div>
            )}

            {suggestions.creators.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text3/50">
                  <Tv className="w-3 h-3" /> Creators
                </div>
                {suggestions.creators.map((c) => (
                  <button key={c} onClick={() => { onChange(c); setFocused(true); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: 'rgba(139,92,246,0.25)', color: '#C4B5FD' }}>{c[0]}</span>
                    <span className="text-xs font-semibold text-white truncate">{c}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.subjects.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text3/50">
                  <BrainCircuit className="w-3 h-3" /> Subjects
                </div>
                {suggestions.subjects.map((s) => (
                  <button key={s} onClick={() => { onChange(s); setFocused(true); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: 'rgba(34,211,238,0.15)', color: '#67E8F9' }}>S</span>
                    <span className="text-xs font-semibold text-white truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.topics.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-text3/50">
                  <BrainCircuit className="w-3 h-3" /> Topics
                </div>
                {suggestions.topics.map((t) => (
                  <button key={t.id || t.name} onClick={() => { onChange(t.name || ''); setFocused(true); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left">
                    <span className="text-xs font-semibold text-white truncate">{t.name}</span>
                    <span className="text-[10px] text-text3/60 ml-auto">{t.subject}</span>
                  </button>
                ))}
              </div>
            )}

            {/* AI intent */}
            {(() => {
              const intent = parseAiQuery(value);
              const hasIntent = intent.subject || intent.type || intent.durationMax;
              if (!hasIntent) return null;
              const label = describeAiQuery(intent);
              const wt = intent.subject ? weightageOf(intent.subject) : null;
              return (
                <div className="border-t border-white/[0.06] mt-1 pt-1">
                  <button
                    onClick={() => { onApplyAi?.(intent); setFocused(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all text-left"
                    style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.16), rgba(34,211,238,0.06))', border: '1px solid rgba(139,92,246,0.25)' }}
                  >
                    <Sparkles className="w-4 h-4 text-[#A78BFA] shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white">AI — find “{label}”</span>
                      <span className="block text-[10px] text-text3/70 mt-0.5">
                        {intent.subject ? `${intent.subject}` : 'All subjects'}
                        {wt ? ` · ${wt} marks weightage` : ''}
                        {intent.type ? ` · ${intent.type}` : ''}
                        {intent.durationMax ? ` · under ${intent.durationMax} min` : ''}
                      </span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
