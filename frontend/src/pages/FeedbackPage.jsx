import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedbackService, getApiErrorMessage } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const POLLS = [
  { id: 'improve_first', question: 'What should be improved first?', options: ['AI Mentor', 'Mobile App', 'More PYQs', 'UI/UX', 'Performance'] },
  { id: 'feature_daily', question: 'Which feature do you use daily?', options: ['Progress Tracking', 'PYQ Practice', 'AI Mentor', 'Revision', 'Planner'] },
  { id: 'subject_resources', question: 'Which subject needs more resources?', options: ['Operating Systems', 'DBMS', 'Computer Networks', 'DSA', 'Theory of Computation', 'Digital Logic', 'CO & Architecture', 'Aptitude'] },
];

const FEATURE_EXAMPLES = [
  'AI Doubt Solver', 'Rank Predictor', 'Mobile App', 'Topic Tests',
  'Subject Tests', 'OCR Formula Sheets', 'Better AI Mentor',
];

function StarRating({ value, onChange, max = 10 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-110 ${i < value ? 'text-white' : 'text-gray-600'}`}
          style={{ background: i < value ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'var(--color-bg-3)' }}
        >{i + 1}</button>
      ))}
      <span className="text-xs ml-2 font-mono" style={{ color: value > 0 ? '#A78BFA' : 'var(--color-text3)' }}>{value > 0 ? `${value}/10` : '—'}</span>
    </div>
  );
}

function Section({ title, desc, icon, children, accent }) {
  return (
    <div className="rounded-2xl p-6 transition-all duration-300" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">{icon}</span>
        <div>
          <h2 className="text-sm font-bold text-text">{title}</h2>
          {desc && <p className="text-[11px] text-text3 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminFeedbacks, setAdminFeedbacks] = useState([]);
  const [anon, setAnon] = useState(false);

  const [ratings, setRatings] = useState({ overall: 0, uiux: 0, aiMentor: 0, revision: 0, mobile: 0 });
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [features, setFeatures] = useState([]);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugPage, setBugPage] = useState('');
  const [bugSeverity, setBugSeverity] = useState('medium');
  const [bugScreenshot, setBugScreenshot] = useState(null);
  const [bugScreenshotPreview, setBugScreenshotPreview] = useState(null);
  const [bugs, setBugs] = useState([]);
  const fileInputRef = useRef(null);
  const [prep, setPrep] = useState({ targetRank: '', targetScore: '', weakestSubject: '', strongestSubject: '', biggestChallenge: '' });
  const [rec, setRec] = useState({ wouldRecommend: '', likes: '', improvements: '', mostUsedFeature: '' });
  const [pollAnswers, setPollAnswers] = useState({});

  useEffect(() => {
    if (isAdmin) {
      feedbackService.getAdminStats().then((r) => setAdminStats(r.data.data)).catch(silentCatch('Load admin stats'));
      feedbackService.getAdminAll({ limit: 50 }).then((r) => setAdminFeedbacks(r.data.data || [])).catch(silentCatch('Load admin feedbacks'));
    }
    feedbackService.get().then((r) => {
      const d = r.data.data;
      if (d) {
        if (d.ratings) setRatings(d.ratings);
        if (d.featureRequests?.length) setFeatures(d.featureRequests);
        if (d.bugReports?.length) setBugs(d.bugReports);
        if (d.preparation) setPrep(d.preparation);
        if (d.recommendation) setRec(d.recommendation);
        if (d.polls?.length) {
          const pa = {};
          d.polls.forEach((p) => { pa[p.questionId] = p.answer; });
          setPollAnswers(pa);
        }
        setAnon(d.anonymous);
      }
    }).catch(silentCatch('Load feedbacks'));
  }, [isAdmin]);

  const addFeature = () => {
    if (!featureTitle.trim()) return toast.error('Enter a feature title');
    setFeatures([...features, { title: featureTitle.trim(), description: featureDesc.trim() }]);
    setFeatureTitle('');
    setFeatureDesc('');
  };

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Screenshot must be under 5MB');
    setBugScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBugScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addBug = () => {
    if (!bugTitle.trim()) return toast.error('Enter a bug title');
    setBugs([...bugs, {
      title: bugTitle.trim(),
      description: bugDesc.trim(),
      pageName: bugPage.trim(),
      severity: bugSeverity,
      screenshotUrl: bugScreenshotPreview || '',
    }]);
    setBugTitle('');
    setBugDesc('');
    setBugPage('');
    setBugSeverity('medium');
    setBugScreenshot(null);
    setBugScreenshotPreview(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = {
        anonymous: anon,
        ratings,
        featureRequests: features,
        bugReports: bugs,
        preparation: prep,
        recommendation: rec,
        polls: Object.entries(pollAnswers).map(([questionId, answer]) => ({ questionId, answer })),
      };
      await feedbackService.submit(data);
      toast.success('Feedback submitted! Thank you.');
      setSubmitted(true);
    } catch (e) {
      console.error('Feedback submit error:', e.response?.status, e.response?.data, e.message);
      toast.error(getApiErrorMessage(e, 'Failed to submit feedback.'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))' }}>
            🎉
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Thank You for Your Feedback!</h2>
          <p className="text-sm text-text3 mb-6">Your input helps make GateNexa better for every GATE aspirant.</p>
          <button onClick={() => setSubmitted(false)} className="btn-primary text-sm">Submit Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#818CF8' }}>Community</span>
        </div>
        <h1 className="text-2xl font-bold text-text tracking-tight">Feedback & Suggestions</h1>
        <p className="text-sm text-text3 mt-1">Help shape GateNexa. Share your thoughts, report bugs, or request features.</p>
      </div>

      {/* Admin Analytics */}
      {isAdmin && adminStats && (
        <div className="mb-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-bold text-text">Admin Analytics</h2>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Feedback', value: adminStats.totalFeedback, color: '#8B5CF6', icon: '📋' },
              { label: 'Avg Rating', value: adminStats.avgRating, color: '#06B6D4', icon: '⭐' },
              { label: 'Satisfaction', value: `${adminStats.satisfactionScore}%`, color: '#22C55E', icon: '😊' },
              { label: 'Bugs Reported', value: adminStats.totalBugReports, color: '#F59E0B', icon: '🐛' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center relative overflow-hidden" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-text3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Feature requests bar chart */}
            <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text3 mb-4">Most Requested Features</p>
              {adminStats.mostRequestedFeatures.length === 0 && <p className="text-[11px] text-text3">No feature requests yet.</p>}
              {adminStats.mostRequestedFeatures.length > 0 && (
                <div className="space-y-3">
                  {(() => {
                    const maxCount = Math.max(...adminStats.mostRequestedFeatures.map((f) => f.count), 1);
                    return adminStats.mostRequestedFeatures.map((f, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-text2 truncate">{f.name}</span>
                          <span className="text-[10px] font-mono" style={{ color: '#8B5CF6' }}>{f.count}x</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-3)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(f.count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Bug severity bar chart */}
            <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text3 mb-4">Bug Severity Distribution</p>
              <div className="space-y-3">
                {(() => {
                  const sevData = ['critical', 'high', 'medium', 'low'];
                  const sevColors = { critical: '#EF4444', high: '#F59E0B', medium: '#8B5CF6', low: '#06B6D4' };
                  const maxVal = Math.max(...sevData.map((s) => adminStats.bugSeverity[s] || 0), 1);
                  return sevData.map((sev) => {
                    const val = adminStats.bugSeverity[sev] || 0;
                    return (
                      <div key={sev}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: sevColors[sev] }} />
                            <span className="text-[11px] capitalize text-text2">{sev}</span>
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text2)' }}>{val}</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-3)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(val / maxVal) * 100}%`, background: sevColors[sev] }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Bottom row: Recommend pie + rating breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text3 mb-3">Would Recommend?</p>
              <div className="flex items-center gap-6">
                {['yes', 'maybe', 'no'].map((opt) => {
                  const total = (adminStats.recommendCounts?.yes || 0) + (adminStats.recommendCounts?.maybe || 0) + (adminStats.recommendCounts?.no || 0) || 1;
                  const pct = Math.round(((adminStats.recommendCounts?.[opt] || 0) / total) * 100);
                  const colors = { yes: '#22C55E', maybe: '#F59E0B', no: '#EF4444' };
                  return (
                    <div key={opt} className="flex-1 text-center">
                      <div className="text-xl font-bold font-mono" style={{ color: colors[opt] }}>{pct}%</div>
                      <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'var(--color-bg-3)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[opt] }} />
                      </div>
                      <div className="text-[9px] text-text3 mt-1 capitalize">{opt === 'yes' ? 'Would' : opt}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text3 mb-3">Rating Breakdown</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Overall', val: adminStats.avgRating, color: '#8B5CF6' },
                  { label: 'UI/UX', val: adminStats.avgUiux, color: '#06B6D4' },
                ].map((r) => (
                  <div key={r.label} className="text-center">
                    <div className="text-lg font-bold font-mono" style={{ color: r.color }}>{r.val}</div>
                    <div className="text-[9px] text-text3">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Feedback Submissions */}
          {adminFeedbacks.length > 0 && (
            <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text3">All Feedback Submissions ({adminFeedbacks.length})</p>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {adminFeedbacks.map((fb, i) => (
                  <div key={fb._id || i} className="rounded-xl p-4" style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[11px] font-medium text-text">{fb.anonymous ? 'Anonymous' : fb.user?.name || 'Unknown'}</span>
                        <span className="text-[9px] text-text3 ml-2">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      {fb.ratings?.overall > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>
                          {fb.ratings.overall}/10
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-text3">
                      {fb.featureRequests?.length > 0 && <span>💡 {fb.featureRequests.length} request{fb.featureRequests.length > 1 ? 's' : ''}</span>}
                      {fb.bugReports?.length > 0 && <span>🐛 {fb.bugReports.length} bug{fb.bugReports.length > 1 ? 's' : ''}</span>}
                      {fb.recommendation?.wouldRecommend && <span>👍 {fb.recommendation.wouldRecommend}</span>}
                      {fb.preparation?.targetRank && <span>🎯 {fb.preparation.targetRank}</span>}
                    </div>
                    {fb.ratings && (fb.ratings.uiux || fb.ratings.aiMentor) && (
                      <div className="flex gap-3 mt-2 text-[9px] text-text3">
                        {fb.ratings.uiux > 0 && <span>UI/UX: {fb.ratings.uiux}/10</span>}
                        {fb.ratings.aiMentor > 0 && <span>AI: {fb.ratings.aiMentor}/10</span>}
                        {fb.ratings.revision > 0 && <span>Revision: {fb.ratings.revision}/10</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* 1. Rate GateNexa */}
        <Section icon="⭐" title="Rate GateNexa" desc="Your ratings help us improve">
          <div className="space-y-4">
            {[
              { key: 'overall', label: 'Overall Rating' },
              { key: 'uiux', label: 'UI/UX Design' },
              { key: 'aiMentor', label: 'AI Mentor' },
              { key: 'revision', label: 'Revision System' },
              { key: 'mobile', label: 'Mobile Experience' },
            ].map((r) => (
              <div key={r.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-xs text-text2 w-32 shrink-0">{r.label}</span>
                <StarRating value={ratings[r.key] || 0} onChange={(v) => setRatings({ ...ratings, [r.key]: v })} />
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Feature Requests */}
        <Section icon="💡" title="Feature Requests" desc="What would you like to see next?">
          <div className="flex flex-wrap gap-2 mb-4">
            {FEATURE_EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setFeatureTitle(ex); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                style={{ background: 'rgba(6,182,212,0.08)', color: '#22D3EE', border: '1px solid rgba(6,182,212,0.15)' }}
              >{ex}</button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input value={featureTitle} onChange={(e) => setFeatureTitle(e.target.value)} placeholder="Feature title..." className="input-field flex-1 text-xs" />
            <input value={featureDesc} onChange={(e) => setFeatureDesc(e.target.value)} placeholder="Brief description (optional)" className="input-field flex-1 text-xs" />
            <button onClick={addFeature} className="btn-primary text-xs whitespace-nowrap">+ Add</button>
          </div>
          {features.length > 0 && (
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <div>
                    <span className="text-xs font-medium text-text">{f.title}</span>
                    {f.description && <p className="text-[10px] text-text3 mt-0.5">{f.description}</p>}
                  </div>
                  <button onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-[10px] text-danger hover:opacity-80">✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 3. Bug Reports */}
        <Section icon="🐛" title="Bug Reports" desc="Found something broken? Let us know.">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} placeholder="Bug title *" className="input-field text-xs" />
            <input value={bugPage} onChange={(e) => setBugPage(e.target.value)} placeholder="Page name" className="input-field text-xs" />
            <textarea value={bugDesc} onChange={(e) => setBugDesc(e.target.value)} placeholder="Description..." rows={2} className="input-field text-xs sm:col-span-2" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[10px] text-text2 font-medium">Severity:</span>
            {['low', 'medium', 'high', 'critical'].map((s) => (
              <button key={s} type="button" onClick={() => setBugSeverity(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${bugSeverity === s ? 'text-white' : 'text-text2'}`}
                style={{
                  background: bugSeverity === s
                    ? s === 'critical' ? '#EF4444' : s === 'high' ? '#F59E0B' : s === 'medium' ? '#8B5CF6' : '#06B6D4'
                    : 'var(--color-bg-3)',
                }}
              >{s}</button>
            ))}
            <button onClick={addBug} className="btn-primary text-xs whitespace-nowrap ml-auto">+ Report</button>
          </div>
          {/* Screenshot upload */}
          <div className="flex items-center gap-4 mb-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22D3EE' }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              {bugScreenshot ? 'Change Screenshot' : 'Upload Screenshot'}
            </button>
            {bugScreenshot && (
              <span className="text-[10px] text-text3">{bugScreenshot.name} ({(bugScreenshot.size / 1024).toFixed(0)}KB)</span>
            )}
            {bugScreenshotPreview && (
              <button type="button" onClick={() => { setBugScreenshot(null); setBugScreenshotPreview(null); }}
                className="text-[10px] text-danger hover:opacity-80">✕ Clear</button>
            )}
          </div>
          {bugScreenshotPreview && (
            <div className="mb-4 rounded-xl overflow-hidden border border-border max-w-xs">
              <img src={bugScreenshotPreview} alt="Screenshot preview" className="w-full h-auto max-h-32 object-cover" />
            </div>
          )}
          {bugs.length > 0 && (
            <div className="space-y-2">
              {bugs.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: b.severity === 'critical' ? '#EF4444' : b.severity === 'high' ? '#F59E0B' : b.severity === 'medium' ? '#8B5CF6' : '#06B6D4' }} />
                    <div>
                      <span className="text-xs font-medium text-text">{b.title}</span>
                      {b.pageName && <span className="text-[9px] text-text3 ml-2">({b.pageName})</span>}
                    </div>
                  </div>
                  <button onClick={() => setBugs(bugs.filter((_, j) => j !== i))} className="text-[10px] text-danger hover:opacity-80">✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 4. GATE Preparation Questions */}
        <Section icon="🎯" title="GATE Preparation" desc="Help us understand your goals">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'targetRank', label: 'Target GATE Rank', placeholder: 'e.g. AIR < 500' },
              { key: 'targetScore', label: 'Target Score', placeholder: 'e.g. 60/100' },
              { key: 'weakestSubject', label: 'Weakest Subject', placeholder: 'e.g. Computer Networks' },
              { key: 'strongestSubject', label: 'Strongest Subject', placeholder: 'e.g. DSA' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input value={prep[f.key] || ''} onChange={(e) => setPrep({ ...prep, [f.key]: e.target.value })} placeholder={f.placeholder} className="input-field text-xs" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Biggest Preparation Challenge</label>
              <textarea value={prep.biggestChallenge || ''} onChange={(e) => setPrep({ ...prep, biggestChallenge: e.target.value })} placeholder="What's the hardest part of your GATE prep?" rows={2} className="input-field text-xs" />
            </div>
          </div>
        </Section>

        {/* 5. Recommendation Section */}
        <Section icon="💬" title="Your Recommendation" desc="Would you recommend GateNexa?">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-text2 uppercase tracking-wider mb-2">Would you recommend GateNexa to a friend?</label>
              <div className="flex gap-3">
                {['yes', 'no', 'maybe'].map((opt) => (
                  <button key={opt} type="button" onClick={() => setRec({ ...rec, wouldRecommend: opt })}
                    className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${rec.wouldRecommend === opt ? 'text-white' : 'text-text2'}`}
                    style={{
                      background: rec.wouldRecommend === opt
                        ? opt === 'yes' ? 'linear-gradient(135deg, #22C55E, #16A34A)' : opt === 'no' ? '#EF4444' : 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : 'var(--color-bg-3)',
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'likes', label: 'What do you like most?', placeholder: 'e.g. AI Mentor, PYQ engine...' },
                { key: 'improvements', label: 'What should be improved?', placeholder: 'e.g. Mobile UI, speed...' },
                { key: 'mostUsedFeature', label: 'Which feature do you use most?', placeholder: 'e.g. Dashboard, Planner...' },
              ].map((f) => (
                <div key={f.key} className={f.key === 'mostUsedFeature' ? 'sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input value={rec[f.key] || ''} onChange={(e) => setRec({ ...rec, [f.key]: e.target.value })} placeholder={f.placeholder} className="input-field text-xs" />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 6. Quick Polls */}
        <Section icon="📊" title="Quick Polls" desc="Cast your vote">
          <div className="space-y-6">
            {POLLS.map((poll) => (
              <div key={poll.id}>
                <p className="text-xs font-medium text-text mb-3">{poll.question}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {poll.options.map((opt) => {
                    const selected = pollAnswers[poll.id] === opt;
                    return (
                      <button key={opt} type="button" onClick={() => setPollAnswers({ ...pollAnswers, [poll.id]: opt })}
                        className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${selected ? 'text-white' : 'text-text2'}`}
                        style={{
                          background: selected ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : 'var(--color-bg-3)',
                          border: selected ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--color-border)',
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Anonymous + Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.03))', border: '1px solid rgba(139,92,246,0.12)' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setAnon(!anon)}
              className={`w-10 h-5 rounded-full transition-all duration-300 relative ${anon ? 'bg-primary' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow ${anon ? 'left-5' : 'left-0.5'}`} />
            </div>
            <div>
              <span className="text-xs font-medium text-text">Submit anonymously</span>
              <p className="text-[9px] text-text3">Your identity won't be stored with this feedback</p>
            </div>
          </label>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary text-sm">
            {loading ? 'Submitting...' : 'Submit Feedback ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}

