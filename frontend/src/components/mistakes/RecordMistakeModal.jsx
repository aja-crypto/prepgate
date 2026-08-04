import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, ImageIcon, Sparkles, ZoomIn, RotateCcw, Trash2, Check } from 'lucide-react';
import { MISTAKE_TYPES, SUBJECT_TOPICS, SUBJECTS } from '../../data/mistakeTypes';

export default function RecordMistakeModal({ open, onClose, onSave }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [mistakeType, setMistakeType] = useState('');
  const [mistake, setMistake] = useState('');
  const [correctConcept, setCorrectConcept] = useState('');
  const [image, setImage] = useState(null);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const topics = useMemo(() => subject ? SUBJECT_TOPICS[subject] || [] : [], [subject]);

  const reset = useCallback(() => {
    setSubject(''); setTopic(''); setMistakeType(''); setMistake('');
    setCorrectConcept(''); setImage(null); setSubjectOpen(false); setSaving(false); setSaved(false); setShowFullscreen(false);
  }, []);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const handleImageUpload = (file) => {
    if (file) setImage(URL.createObjectURL(file));
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const t = item.types.find(t => t.startsWith('image/'));
        if (t) { const blob = await item.getType(t); setImage(URL.createObjectURL(blob)); return; }
      }
    } catch {}
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  };

  const handleSave = async () => {
    if (!subject || !mistake.trim()) return;
    setSaving(true);
    await onSave({ subject, topic, mistakeType: mistakeType || 'concept_mistake', mistake, correctConcept, image });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onClose(); }, 600);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && subject && mistake.trim()) handleSave();
  };

  const valid = subject && mistake.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(6,7,10,0.75)', backdropFilter: 'blur(10px)' }}
          onClick={onClose}
          onKeyDown={handleKeyDown}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden md:max-h-[85vh]"
            style={{ background: '#0D1017', border: '1px solid rgba(255,255,255,0.04)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#fff' }}>Record Mistake</h2>
                <p className="text-[10px] mt-0.5" style={{ color: '#6F7685' }}>Classify and save your mistake in seconds</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.04] transition-all" style={{ color: '#6F7685' }}><X size={16} /></button>
            </div>

            {/* Split layout */}
            <div className="flex flex-col md:flex-row md:h-[calc(85vh-64px)]">
              {/* LEFT — Image */}
              <div className="md:w-[45%] p-5 border-r border-white/[0.04] flex flex-col" style={{ background: 'rgba(6,7,10,0.4)' }}>
                <p className="text-[10px] font-medium mb-3 flex-shrink-0" style={{ color: '#6F7685' }}>Question Screenshot</p>
                {image ? (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    <div className="relative group flex-1 min-h-0">
                      <div className="h-full rounded-xl overflow-hidden border border-white/[0.06] cursor-zoom-in"
                        onClick={() => setShowFullscreen(true)}>
                        <img src={image} alt="" className="w-full h-full object-contain" style={{ background: '#06070A' }} />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowFullscreen(true)} className="w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}><ZoomIn size={12} /></button>
                        <button onClick={() => { fileInputRef.current?.click(); }} className="w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(124,92,255,0.4)', color: '#fff' }}><RotateCcw size={12} /></button>
                        <button onClick={() => setImage(null)} className="w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(255,107,107,0.3)', color: '#FF6B6B' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {/* Image controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: 'rgba(124,92,255,0.08)', color: '#7C5CFF', border: '1px solid rgba(124,92,255,0.15)' }}>
                        <Upload size={11} /> Replace
                      </button>
                      <button onClick={() => { setImage(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: 'rgba(255,107,107,0.08)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.12)' }}>
                        <Trash2 size={11} /> Remove
                      </button>
                      <button onClick={() => setShowFullscreen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ml-auto"
                        style={{ background: 'rgba(255,255,255,0.03)', color: '#6F7685', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <ZoomIn size={11} /> Fullscreen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}>
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer"
                      style={{
                        borderColor: dragOver ? 'rgba(124,92,255,0.4)' : 'rgba(255,255,255,0.06)',
                        background: dragOver ? 'rgba(124,92,255,0.04)' : 'rgba(255,255,255,0.01)',
                      }}
                      onClick={() => fileInputRef.current?.click()}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,92,255,0.08)' }}>
                        <ImageIcon size={24} style={{ color: 'rgba(124,92,255,0.4)' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium" style={{ color: '#A5ADBB' }}>Upload Question Screenshot</p>
                        <p className="text-[10px] mt-1" style={{ color: 'rgba(111,118,133,0.6)' }}>Click to browse · Drag & drop · Paste (Ctrl+V)</p>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.03)', color: '#6F7685', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <Upload size={13} /> Upload Image
                        </span>
                        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.03)', color: '#6F7685', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <Camera size={13} /> Camera
                        </span>
                        <span onClick={(e) => { e.stopPropagation(); handlePaste(); }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-medium cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)', color: '#6F7685', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <ImageIcon size={13} /> Paste
                        </span>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  </div>
                )}
              </div>

              {/* RIGHT — Form */}
              <div className="md:w-[55%] p-5 overflow-y-auto space-y-4">
                {/* Subject */}
                <div className="relative">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: '#6F7685' }}>Subject <span style={{ color: '#FF6B6B' }}>*</span></p>
                  <input value={subject} onFocus={() => setSubjectOpen(true)} onChange={e => { setSubject(e.target.value); setTopic(''); setSubjectOpen(true); }}
                    placeholder="Search subject..." className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }} />
                  {subjectOpen && SUBJECTS.filter(s => s.toLowerCase().includes(subject.toLowerCase())).length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border shadow-2xl overflow-hidden" style={{ background: '#0D1017', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="max-h-36 overflow-y-auto py-1">
                        {SUBJECTS.filter(s => s.toLowerCase().includes(subject.toLowerCase()) || !subject).map(s => (
                          <button key={s} onClick={() => { setSubject(s); setSubjectOpen(false); }} className="w-full px-3.5 py-2 text-xs text-left transition-all hover:bg-white/[0.02]" style={{ color: subject === s ? '#7C5CFF' : '#A5ADBB' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Topic chips */}
                {subject && topics.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium mb-1.5" style={{ color: '#6F7685' }}>Topic</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map(t => (
                        <button key={t} onClick={() => setTopic(topic === t ? '' : t)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{ background: topic === t ? 'rgba(124,92,255,0.1)' : 'rgba(255,255,255,0.02)', color: topic === t ? '#7C5CFF' : '#6F7685', border: `1px solid ${topic === t ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.04)'}` }}>{t}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mistake Type */}
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: '#6F7685' }}>Mistake Type <span style={{ color: '#FF6B6B' }}>*</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {MISTAKE_TYPES.map(mt => (
                      <button key={mt.value} onClick={() => setMistakeType(mistakeType === mt.value ? '' : mt.value)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5"
                        style={{ background: mistakeType === mt.value ? `${mt.color}15` : 'rgba(255,255,255,0.02)', color: mistakeType === mt.value ? mt.color : '#6F7685', border: `1px solid ${mistakeType === mt.value ? `${mt.color}30` : 'rgba(255,255,255,0.04)'}` }}>
                        <span>{mt.emoji}</span> {mt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* What went wrong */}
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: '#6F7685' }}>What went wrong? <span style={{ color: '#FF6B6B' }}>*</span></p>
                  <textarea value={mistake} onChange={e => setMistake(e.target.value)} rows={2} placeholder="e.g., Forgot the difference between prevention and avoidance..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>

                {/* Correct concept */}
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: '#6F7685' }}>Correct Concept <span style={{ opacity: 0.4 }}>(optional)</span></p>
                  <textarea value={correctConcept} onChange={e => setCorrectConcept(e.target.value)} rows={1} placeholder="e.g., Prevention ensures at least one condition fails..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }} />
                </div>

                {/* Save */}
                <motion.button whileHover={valid ? { scale: 1.01 } : {}} whileTap={valid ? { scale: 0.98 } : {}}
                  onClick={handleSave} disabled={!valid || saving || saved}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7C5CFF, #6A4CE0)', color: '#fff', boxShadow: '0 4px 20px rgba(124,92,255,0.25)' }}>
                  {saved ? (
                    <><Check size={18} className="animate-fade-in" /> Saved!</>
                  ) : saving ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
                  ) : (
                    <><Sparkles size={16} /> Save Mistake</>
                  )}
                </motion.button>

                <p className="text-[9px] text-center" style={{ color: 'rgba(111,118,133,0.3)' }}>Press Ctrl+Enter to save quickly</p>
              </div>
            </div>
          </motion.div>

          {/* Fullscreen image preview */}
          {showFullscreen && image && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-8" style={{ background: 'rgba(0,0,0,0.9)' }}
              onClick={() => setShowFullscreen(false)}>
              <button onClick={() => setShowFullscreen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: '#fff' }}>
                <X size={20} />
              </button>
              <img src={image} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}