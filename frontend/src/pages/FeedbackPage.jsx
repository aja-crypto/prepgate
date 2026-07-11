import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { feedbackService, getApiErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

const RATING_META = [
  { stars: 1, emoji: '😭', label: 'Very Poor', color: '#EF4444', glow: 'rgba(239,68,68,0.3)', msg: "We're sorry — tell us what went wrong." },
  { stars: 2, emoji: '😞', label: 'Poor', color: '#F97316', glow: 'rgba(249,115,22,0.3)', msg: 'We can do better. What should improve?' },
  { stars: 3, emoji: '😐', label: 'Average', color: '#EAB308', glow: 'rgba(234,179,8,0.3)', msg: 'It was okay. How can we improve?' },
  { stars: 4, emoji: '😊', label: 'Good', color: '#22C55E', glow: 'rgba(34,197,94,0.3)', msg: 'Glad you liked it! Any suggestions?' },
  { stars: 5, emoji: '🤩', label: 'Excellent', color: '#A855F7', glow: 'rgba(168,85,247,0.3)', msg: 'Amazing! Tell us what you love!' },
];

const CATEGORIES = [
  { id: 'bug', label: 'Bug Report', icon: '🐞', desc: 'Something broke', color: '#EF4444' },
  { id: 'feature', label: 'Feature Request', icon: '💡', desc: 'I have an idea', color: '#22D3EE' },
  { id: 'uiux', label: 'UI/UX', icon: '🎨', desc: 'Design feedback', color: '#8B5CF6' },
  { id: 'performance', label: 'Performance', icon: '⚡', desc: 'Speed or lag issues', color: '#F59E0B' },
  { id: 'ai', label: 'AI Mentor', icon: '🤖', desc: 'AI-related feedback', color: '#A855F7' },
  { id: 'content', label: 'Study Material', icon: '📚', desc: 'Notes, PYQs, resources', color: '#06B6D4' },
  { id: 'mobile', label: 'Mobile Experience', icon: '📱', desc: 'Mobile app feedback', color: '#3B82F6' },
  { id: 'general', label: 'General', icon: '💬', desc: 'Something else', color: '#22C55E' },
];

const RECOMMEND_OPTS = [
  { id: 'yes', label: 'Definitely', icon: '😍', desc: 'I love GateNexa!', color: '#22C55E' },
  { id: 'maybe', label: 'Maybe', icon: '🙂', desc: 'It has potential', color: '#F59E0B' },
  { id: 'no', label: 'Not Yet', icon: '😕', desc: 'Needs improvement', color: '#EF4444' },
];

const SUGGESTED_PROMPTS = ['What did you like?', 'What confused you?', 'How can GateNexa improve?', 'Any features missing?'];

const STORAGE_KEY = 'gatenexa_feedback_draft';

function loadDraft() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
function saveDraft(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function clearDraft() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

export default function FeedbackPage() {
  useEffect(() => { const t = Date.now(); console.log('[Trace] FeedbackPage MOUNTED at', t); return () => console.log('[Trace] FeedbackPage UNMOUNTED after', Date.now() - t, 'ms'); }, []);
  const [step, setStep] = useState(() => loadDraft().step || 'welcome');
  const [rating, setRating] = useState(() => loadDraft().rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState(() => loadDraft().category || '');
  const [description, setDescription] = useState(() => loadDraft().description || '');
  const [screenshot, setScreenshot] = useState(() => loadDraft().screenshot || null);
  const [screenshotPreview, setScreenshotPreview] = useState(() => loadDraft().screenshotPreview || null);
  const [recommend, setRecommend] = useState(() => loadDraft().recommend || '');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitPhase, setSubmitPhase] = useState('');
  const fileRef = useRef(null);
  const submitGuard = useRef(false);
  const textRef = useRef(null);

  const save = useCallback(() => saveDraft({ step, rating, category, description, screenshot, screenshotPreview, recommend }), [step, rating, category, description, screenshot, screenshotPreview, recommend]);

  const go = (s) => { setStep(s); setTimeout(save, 0); };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast.error('Max 10MB');
    setScreenshot(f);
    const r = new FileReader();
    r.onload = (ev) => setScreenshotPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (submitGuard.current) return;
    if (!description.trim()) return toast.error('Please share your thoughts.');
    submitGuard.current = true;
    setSubmitting(true);
    setSubmitPhase('Saving');
    try {
      const phases = ['Uploading...', 'Analyzing...', 'Saving...', 'Almost there...'];
      for (let i = 0; i < phases.length; i++) {
        setSubmitPhase(phases[i]);
        setUploadProgress((i + 1) * 25);
        await new Promise(r => setTimeout(r, 400));
      }
      await feedbackService.submit({
        category: category || 'general', description: description.trim(), ratings: { overall: rating },
        recommendation: recommend ? { wouldRecommend: recommend } : undefined,
        page: window.location.pathname,
      });
      clearDraft();
      go('done');
      toast.success('Feedback submitted!');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to submit.'));
      submitGuard.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setStep('welcome'); setRating(0); setCategory(''); setDescription(''); setScreenshot(null); setScreenshotPreview(null); setRecommend(''); clearDraft(); };

  const meta = RATING_META[hoverRating - 1] || RATING_META[rating - 1] || RATING_META[0];

  return (
    <div className="min-h-screen" style={{ background: '#070B1A' }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link to="/" className="text-xs text-purple-400 hover:text-purple-300 mb-8 inline-block transition-colors">← Back to Home</Link>
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center pt-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 12 }}
              className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))' }}>
              💜
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-3">Your Feedback Builds a Better GateNexa</h1>
            <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">Your suggestions directly improve the platform for thousands of GATE aspirants.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go('rating')}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 4px 24px rgba(139,92,246,0.35)' }}>
              Share Feedback ✨
            </motion.button>
          </motion.div>
        )}

        {step === 'rating' && (
          <motion.div key="rating" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <button onClick={() => go('welcome')} className="text-xs text-slate-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back
            </button>
            <div className="text-center mb-8">
              <motion.div key={rating} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl mb-4">{hoverRating > 0 || rating > 0 ? meta.emoji : '⭐'}</motion.div>
              <h2 className="text-lg font-bold text-white mb-1">{hoverRating > 0 || rating > 0 ? meta.label : 'Rate your experience'}</h2>
              <p className="text-xs text-slate-500">{hoverRating > 0 || rating > 0 ? meta.msg : 'Tap a star to rate'}</p>
            </div>
            <div className="flex justify-center gap-2 mb-8" onMouseLeave={() => setHoverRating(0)}>
              {[1,2,3,4,5].map(n => {
                const filled = n <= (hoverRating || rating);
                const m = RATING_META[n-1];
                return (
                  <motion.button key={n} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoverRating(n)}
                    onClick={() => { setRating(n); setTimeout(() => go('category'), 400); }}
                    className="relative p-2 rounded-xl transition-all" style={{ background: filled ? `${m.color}15` : 'transparent' }}>
                    <svg viewBox="0 0 24 24" className="w-10 h-10 transition-all" style={{ filter: filled ? `drop-shadow(0 0 8px ${m.glow})` : 'none' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? m.color : 'rgba(255,255,255,0.15)'} />
                    </svg>
                    {n === 5 && filled && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-xs">✨</motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex justify-center gap-2">
              <span className="text-3xl">{meta.emoji}</span>
            </div>
            <div className="flex justify-center mt-6">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go('category')}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                Next →
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <button onClick={() => go('rating')} className="text-xs text-slate-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-4">What's this about?</h2>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(c => {
                const sel = category === c.id;
                return (
                  <motion.button key={c.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setCategory(c.id); setTimeout(() => go('input'), 300); }}
                    className={`p-4 rounded-2xl text-left transition-all ${sel ? 'text-white' : 'text-slate-300'}`}
                    style={{ background: sel ? `${c.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? c.color : 'rgba(255,255,255,0.06)'}`, boxShadow: sel ? `0 0 20px ${c.color}30` : 'none' }}>
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.desc}</div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <button onClick={() => go('category')} className="text-xs text-slate-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-1">Share your thoughts</h2>
            <p className="text-xs text-slate-500 mb-4">Your feedback is anonymous by default.</p>
            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_PROMPTS.map(p => (
                <button key={p} onClick={() => { setDescription(p); textRef.current?.focus(); }}
                  className="text-[11px] px-3 py-1.5 rounded-full transition-all hover:scale-[1.02]" style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.12)' }}>
                  {p}
                </button>
              ))}
            </div>
            <textarea ref={textRef} value={description} onChange={e => setDescription(e.target.value)} autoFocus
              placeholder={category === 'bug' ? 'What went wrong? Steps to reproduce...' : category === 'feature' ? 'Describe the feature...' : 'Share your thoughts...'}
              rows={4} maxLength={5000}
              className="w-full bg-transparent border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50 transition-all"
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
            <div className="flex justify-between items-center mt-3 mb-6">
              <span className={`text-xs font-mono ${description.length > 4500 ? 'text-red-400' : 'text-slate-600'}`}>{description.length}/5000</span>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 005.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                Add Screenshot
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleDrop} />
            </div>
            {screenshotPreview && (
              <div className="relative rounded-2xl overflow-hidden mb-6 border border-white/10">
                <img src={screenshotPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button onClick={() => { setScreenshot(null); setScreenshotPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-black/80 transition-colors">✕</button>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => go('recommend')}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              Continue →
            </motion.button>
          </motion.div>
        )}

        {step === 'recommend' && (
          <motion.div key="recommend" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <button onClick={() => go('input')} className="text-xs text-slate-500 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-1">Would you recommend GateNexa?</h2>
            <p className="text-xs text-slate-500 mb-6">Your answer helps us grow.</p>
            <div className="space-y-3 mb-8">
              {RECOMMEND_OPTS.map(opt => {
                const sel = recommend === opt.id;
                return (
                  <motion.button key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setRecommend(opt.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${sel ? 'text-white' : 'text-slate-300'}`}
                    style={{ background: sel ? `${opt.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? opt.color : 'rgba(255,255,255,0.06)'}` }}>
                    <span className="text-3xl">{opt.icon}</span>
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {submitPhase}</>
              ) : 'Submit Feedback ✨'}
            </motion.button>
            {submitting && (
              <div className="mt-4 w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.5 }} style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
              </div>
            )}
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-16">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))' }}>
              <motion.span animate={{ rotate: [0, 10, 0] }} transition={{ duration: 0.5, delay: 0.3 }}>🎉</motion.span>
            </motion.div>
            <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl font-bold text-white mb-2">Thank You!</motion.h2>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-slate-400 mb-8">Your feedback has been submitted and will help improve GateNexa.</motion.p>
            <motion.button initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={reset}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              Submit Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
