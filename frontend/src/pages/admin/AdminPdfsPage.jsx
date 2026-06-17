import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPdfService } from '../../services/adminApi';

const CATEGORIES = [
  { value: 'pyq', label: 'PYQ', color: '#8B5CF6' },
  { value: 'notes', label: 'Notes', color: '#10B981' },
  { value: 'study_material', label: 'Study Material', color: '#3B82F6' },
  { value: 'syllabus', label: 'Syllabus', color: '#F59E0B' },
];

export default function AdminPdfsPage() {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'pyq', subject: '', year: '' });
  const [filter, setFilter] = useState({ category: '', subject: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const fetchPdfs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.subject) params.subject = filter.subject;
      const res = await adminPdfService.getAll(params);
      setPdfs(res.data.data || []);
    } catch (e) {
      setError('Failed to load PDFs.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File must be under 50 MB.');
      return;
    }

    clearMsg();
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.pdf$/i, ''));
    formData.append('description', '');
    formData.append('category', editForm.category || 'pyq');
    formData.append('subject', editForm.subject || '');
    formData.append('year', editForm.year || '');

    try {
      await adminPdfService.upload(formData, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      setSuccess('PDF uploaded successfully.');
      fetchPdfs();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this PDF permanently?')) return;
    clearMsg();
    try {
      await adminPdfService.delete(id);
      setSuccess('PDF deleted.');
      fetchPdfs();
    } catch (e) {
      setError('Delete failed.');
    }
  };

  const handleTogglePublish = async (id, current) => {
    clearMsg();
    try {
      await adminPdfService.togglePublish(id, !current);
      setSuccess(current ? 'PDF unpublished.' : 'PDF published.');
      fetchPdfs();
    } catch (e) {
      setError('Update failed.');
    }
  };

  const startEdit = (pdf) => {
    setEditingId(pdf._id);
    setEditForm({
      title: pdf.title,
      description: pdf.description || '',
      category: pdf.category,
      subject: pdf.subject || '',
      year: pdf.year?.toString() || '',
    });
  };

  const saveEdit = async (id) => {
    clearMsg();
    try {
      await adminPdfService.update(id, editForm);
      setSuccess('PDF updated.');
      setEditingId(null);
      fetchPdfs();
    } catch (e) {
      setError('Update failed.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const catLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;
  const catColor = (val) => CATEGORIES.find(c => c.value === val)?.color || '#666';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">PDF Management</h1>
          <p className="text-sm text-text3 mt-0.5">Upload and manage study materials</p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-2">&times;</button>
        </div>
      )}
      {success && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300 ml-2">&times;</button>
        </div>
      )}

      <div
        ref={dropRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text3">Category:</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
              className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text"
              onClick={(e) => e.stopPropagation()}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text3">Subject:</label>
            <input
              value={editForm.subject}
              onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. OS, DBMS"
              className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text w-24"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text3">Year:</label>
            <input
              value={editForm.year}
              onChange={(e) => setEditForm(f => ({ ...f, year: e.target.value }))}
              placeholder="2024"
              className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text w-20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {uploading ? (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-text2">Uploading... {uploadProgress}%</div>
            <div className="w-full max-w-xs mx-auto h-2 bg-bg-3 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-text3">
            <span className="text-primary font-semibold">Click to upload</span> or drag and drop a PDF here
            <br /><span className="text-[11px]">Max 50 MB</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filter.category}
          onChange={(e) => setFilter(f => ({ ...f, category: e.target.value }))}
          className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          value={filter.subject}
          onChange={(e) => setFilter(f => ({ ...f, subject: e.target.value }))}
          placeholder="Filter by subject..."
          className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder-text3 w-32"
        />
        <span className="text-[11px] text-text3">{pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading PDFs...</div>
      ) : pdfs.length === 0 ? (
        <div className="text-center py-12 text-sm text-text3">No PDFs found. Upload one above.</div>
      ) : (
        <div className="space-y-2">
          {pdfs.map((pdf) => (
            <div key={pdf._id} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
              {editingId === pdf._id ? (
                <div className="space-y-3">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <select value={editForm.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))} className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input value={editForm.subject} onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text w-24" />
                    <input value={editForm.year} onChange={(e) => setEditForm(f => ({ ...f, year: e.target.value }))} placeholder="Year" className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text w-20" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(pdf._id)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-semibold">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg bg-bg-2 text-text3 border border-border">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text truncate">{pdf.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium`}
                        style={{ background: `${catColor(pdf.category)}15`, color: catColor(pdf.category) }}>
                        {catLabel(pdf.category)}
                      </span>
                      {!pdf.isPublished && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-yellow-500/10 text-yellow-400">Draft</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-text3 flex-wrap">
                      {pdf.subject && <span>{pdf.subject}</span>}
                      {pdf.year && <span>{pdf.year}</span>}
                      {pdf.fileSize && <span>{(pdf.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                      <span>{new Date(pdf.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(pdf)} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Edit">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    </button>
                    <button onClick={() => window.open(`/protected/view/${pdf._id}`, '_blank')} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Open viewer">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleTogglePublish(pdf._id, pdf.isPublished)} className={`p-1.5 rounded-lg transition-colors ${pdf.isPublished ? 'text-green-500 hover:bg-green-500/10' : 'text-text3 hover:text-yellow-400 hover:bg-yellow-500/10'}`} title={pdf.isPublished ? 'Unpublish' : 'Publish'}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.5 5a1 1 0 011-1h2a1 1 0 010 2H5.5v7h1a1 1 0 010 2h-4a1 1 0 010-2h1V5zm8.707 2.293a1 1 0 00-1.414 1.414L12.086 10l-1.293 1.293a1 1 0 101.414 1.414L13.5 11.414l1.293 1.293a1 1 0 001.414-1.414L14.914 10l1.293-1.293a1 1 0 00-1.414-1.414L13.5 8.586l-1.293-1.293z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleDelete(pdf._id)} className="p-1.5 rounded-lg text-text3 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
