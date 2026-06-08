// src/pages/NotesPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgress } from '../context/ProgressContext';
import { noteService } from '../services/api';
import Modal from '../components/common/Modal';
import Icon from '../components/ui/Icon';
import GlassCard from '../components/ui/GlassCard';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#4f8dff', '#7c5cfc', '#06d6a0', '#ff9f43', '#ff6b6b', '#a855f7', '#06b6d4'];
const SUBJECTS = [
  'Engineering Mathematics', 'Digital Logic', 'Computer Organization', 
  'Programming & DS', 'Algorithms', 'Operating Systems', 'DBMS', 
  'Computer Networks', 'TOC', 'Compiler Design', 'Aptitude'
];

const NOTE_TYPES = [
  { id: 'text', label: 'Text Note', icon: 'note' },
  { id: 'formula_sheet', label: 'Formula Sheet', icon: 'star' },
  { id: 'handwritten', label: 'Handwritten', icon: 'note' },
  { id: 'screenshot', label: 'Screenshot', icon: 'note' },
  { id: 'pdf', label: 'PDF Document', icon: 'note' },
  { id: 'image', label: 'Image/Diagram', icon: 'note' }
];

export default function NotesPage() {
  const { mongoAvailable } = useProgress();
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  
  const [form, setForm] = useState({ 
    title: '', 
    subject: SUBJECTS[0], 
    content: '', 
    type: 'text',
    isPinned: false
  });
  const [file, setFile] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (search) params.search = search;
      
      const [notesRes, statsRes] = await Promise.all([
        noteService.getAll(params).catch(e => ({ data: { data: [] } })),
        noteService.getStats().catch(e => ({ data: { data: { recent: [], mostViewed: [], pinned: [] } } }))
      ]);
      
      setNotes(notesRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (err) {
      console.error('Fetch Notes Error:', err);
      toast.error('Connection issue: Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedSubject, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');

    const formData = new FormData();
    // Append all form fields
    formData.append('title', form.title);
    formData.append('subject', form.subject);
    formData.append('content', form.content || '');
    formData.append('type', form.type);
    formData.append('isPinned', String(form.isPinned));
    
    // Only append file if it exists
    if (file) {
      formData.append('file', file);
    }

    try {
      setLoading(true);
      const res = await noteService.create(formData);
      if (res.data.success) {
        toast.success('Note added successfully');
        setShowModal(false);
        setForm({ title: '', subject: SUBJECTS[0], content: '', type: 'text', isPinned: false });
        setFile(null);
        fetchNotes();
      } else {
        throw new Error(res.data.message || 'Server error');
      }
    } catch (err) {
      console.error('Save Note Error:', err);
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to save note: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (note) => {
    try {
      await noteService.update(note._id, { isPinned: !note.isPinned });
      fetchNotes();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await noteService.delete(id);
      toast.success('Deleted');
      fetchNotes();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const pinnedFormulas = useMemo(() => 
    notes.filter(n => n.type === 'formula_sheet' && n.isPinned), 
  [notes]);

  const recentNotes = useMemo(() => notes.slice(0, 4), [notes]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Notes & Formula Sheets</h1>
          <p className="text-sm text-text3">Advanced repository for your GATE 2027 preparation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes, formulas..." 
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary/50 w-64"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Icon name="plus" className="w-4 h-4" /> New Resource
          </button>
        </div>
      </div>

      {/* Quick Access / Pinned Formulas */}
      {pinnedFormulas.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="star" className="text-yellow-500 w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text2">Pinned Formula Sheets</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedFormulas.map(f => (
              <GlassCard key={f._id} className="group relative overflow-hidden" padding="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon name="star" className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text truncate max-w-[150px]">{f.title}</div>
                      <div className="text-[10px] text-text3">{f.subject}</div>
                    </div>
                  </div>
                  <button onClick={() => togglePin(f)} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="star" className="w-4 h-4 fill-current" />
                  </button>
                </div>
                {f.fileUrl || f.imageUrl ? (
                  <button 
                    onClick={() => setViewingMedia(f)}
                    className="w-full aspect-video rounded-lg bg-bg-3 border border-border overflow-hidden relative group/img"
                  >
                    {f.fileType?.includes('pdf') ? (
                      <div className="flex flex-col items-center justify-center h-full text-text3">
                        <Icon name="note" className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold">VIEW PDF</span>
                      </div>
                    ) : (
                      <img 
                        src={f.imageUrl || f.fileUrl} 
                        alt={f.title} 
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/1a1a1a/4f8dff?text=Image+Not+Found';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <Icon name="search" className="text-white w-6 h-6" />
                    </div>
                  </button>
                ) : (
                  <div className="text-xs text-text2 line-clamp-3 bg-bg-3 p-3 rounded-lg border border-border font-mono">
                    {f.content}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text3 mb-4">Subjects</h3>
            <div className="space-y-1">
              {['All', ...SUBJECTS].map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                    selectedSubject === s ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 'text-text2 hover:bg-surface border border-transparent hover:border-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {stats && (
            <section className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text3 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text2">Total Resources</span>
                  <span className="text-sm font-bold text-text">{notes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text2">Formula Sheets</span>
                  <span className="text-sm font-bold text-primary">{notes.filter(n => n.type === 'formula_sheet').length}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Resources Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">{selectedSubject} Resources</h2>
            <div className="flex gap-2">
              {NOTE_TYPES.map(t => (
                <button key={t.id} title={t.label} className="p-2 rounded-lg border border-border bg-surface text-text3 hover:text-primary transition-colors">
                  <Icon name={t.icon} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-surface border border-border rounded-2xl" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-dashed border-border rounded-3xl text-text3">
              <Icon name="note" className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No resources found for this subject</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-primary text-xs font-bold uppercase tracking-widest hover:underline">Create First Note</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {notes.map(n => (
                <GlassCard key={n._id} className="group flex flex-col h-full" padding="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-3 border border-border flex items-center justify-center text-primary group-hover:border-primary/30 transition-colors">
                        <Icon name={NOTE_TYPES.find(t => t.id === n.type)?.icon || 'note'} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">{n.title}</div>
                        <div className="text-[10px] text-text3 flex items-center gap-1.5 mt-0.5">
                          <span>{n.subject}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg hover:bg-bg-3 ${n.isPinned ? 'text-yellow-500' : 'text-text3'}`}>
                        <Icon name="star" className={`w-3.5 h-3.5 ${n.isPinned ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => deleteNote(n._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text3 hover:text-red-400">
                        <Icon name="close" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {n.fileUrl || n.imageUrl ? (
                    <button 
                      onClick={() => setViewingMedia(n)}
                      className="flex-1 w-full bg-bg-3 rounded-xl border border-border overflow-hidden relative group/media mb-4 min-h-[120px]"
                    >
                      {n.fileType?.includes('pdf') ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-text3">
                          <Icon name="note" className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Open PDF Document</span>
                        </div>
                      ) : (
                        <img 
                          src={n.imageUrl || n.fileUrl} 
                          alt={n.title} 
                          className="w-full h-full object-cover group-hover/media:scale-105 transition-transform" 
                          onError={(e) => {
                            console.error(`Failed to load image for note: ${n.title}`, n.imageUrl || n.fileUrl);
                            e.target.src = 'https://placehold.co/600x400/1a1a1a/4f8dff?text=Image+Not+Found';
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="bg-white/90 p-2 rounded-full text-primary shadow-xl">
                          <Icon name="search" className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1 bg-bg-3 rounded-xl border border-border p-4 text-xs text-text2 leading-relaxed mb-4 overflow-hidden line-clamp-6 font-mono">
                      {n.content}
                    </div>
                  )}

                  {n.ocrText && (
                    <div className="mb-4 p-2 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-text3 italic line-clamp-2">
                      <span className="font-bold text-primary not-italic mr-1">AI OCR:</span> {n.ocrText}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <div className="flex gap-1.5">
                      {n.tags?.map(t => <span key={t} className="text-[9px] font-bold text-text3 px-2 py-0.5 rounded-full bg-bg-3 border border-border">#{t}</span>)}
                    </div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                      {n.type?.replace('_', ' ')} <Icon name="arrow-right" className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {viewingMedia && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-black/95 animate-fade-in">
          <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewingMedia(null)} className="text-white hover:text-primary transition-colors">
                <Icon name="close" className="w-6 h-6" />
              </button>
              <div>
                <div className="text-white font-bold">{viewingMedia.title}</div>
                <div className="text-[10px] text-text3 uppercase font-black tracking-widest">{viewingMedia.subject}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/10 rounded-xl p-1">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 text-white hover:bg-white/10 rounded-lg"><Icon name="minus" className="w-4 h-4" /></button>
                <span className="text-xs text-white font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 text-white hover:bg-white/10 rounded-lg"><Icon name="plus" className="w-4 h-4" /></button>
              </div>
              <a href={viewingMedia.fileUrl} download className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                <Icon name="download" className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center custom-scrollbar">
            {viewingMedia.fileType?.includes('pdf') ? (
              <iframe src={viewingMedia.imageUrl || viewingMedia.fileUrl} className="w-full h-full max-w-5xl rounded-xl shadow-2xl bg-white" title="PDF Viewer" />
            ) : (
              <img 
                src={viewingMedia.imageUrl || viewingMedia.fileUrl} 
                alt={viewingMedia.title} 
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                className="max-w-full max-h-full shadow-2xl rounded-lg cursor-zoom-in"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400/1a1a1a/4f8dff?text=Image+Load+Error';
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Create Resource Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="🚀 Add New Resource" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Title</label>
                <input 
                  required
                  value={form.title} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                  placeholder="e.g. Dijkstra's Algorithm Summary" 
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Subject</label>
                <select 
                  value={form.subject} 
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} 
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Resource Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.id }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                        form.type === t.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-bg-2 border-border text-text3 hover:border-text3/30'
                      }`}
                    >
                      <Icon name={t.icon} className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">
                  {form.type === 'text' ? 'Content' : 'Optional Description'}
                </label>
                <textarea 
                  value={form.content} 
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} 
                  placeholder={form.type === 'text' ? "Write your notes here..." : "Add a brief description of the uploaded file..."}
                  rows={form.type === 'text' ? 10 : 4} 
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60 resize-none font-mono" 
                />
              </div>

              {form.type !== 'text' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">File Upload</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={e => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept={form.type === 'pdf' ? '.pdf' : 'image/*'}
                    />
                    <div className="bg-bg-3 border-2 border-dashed border-border group-hover:border-primary/50 rounded-2xl p-6 text-center transition-all">
                      <Icon name="upload" className="w-8 h-8 text-text3 group-hover:text-primary mx-auto mb-2" />
                      <div className="text-xs font-bold text-text2">
                        {file ? file.name : 'Drag & drop or click to upload'}
                      </div>
                      <div className="text-[10px] text-text3 mt-1">PDF or Images up to 10MB</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={form.isPinned} 
                    onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-bg-2"
                  />
                  <span className="text-xs font-bold text-text2 group-hover:text-text">Pin to Top / Dashboard</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="flex-1 px-6 py-3 rounded-xl border border-border text-text3 font-bold text-sm hover:bg-bg-2 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Resource
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
