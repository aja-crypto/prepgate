import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import adminApi from '../../services/adminApi';

const MAX_SIZE_MB = 50;

export default function AdminPyqPapersPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [setNum, setSetNum] = useState(1);
  const [title, setTitle] = useState('');
  const dropRef = useRef(null);
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await adminApi.get('/admin/pyq-papers');
      if (data.success) setPapers(data.data);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
      setError(err.response?.data?.message || 'Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPapers(); }, []);

  const validateFile = (file) => {
    if (!file) { setError('Please select a PDF file'); return false; }
    if (file.type !== 'application/pdf') { setError('Only PDF files are allowed'); return false; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File too large. Maximum ${MAX_SIZE_MB}MB`); return false; }
    // Check duplicates
    const exists = papers.some(p => p.filename === file.name || p.title === file.name);
    if (exists) { setError(`File "${file.name}" already exists`); return false; }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target?.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select a PDF file'); return; }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Validating file...');
    setError('');
    setSuccess(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('year', year);
    formData.append('set', setNum);
    formData.append('title', title || `GATE CSE ${year} Set ${setNum}`);

    try {
      setUploadStatus('Uploading...');
      setUploadProgress(50);
      
      const { data } = await adminApi.post('/admin/pyq-papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadProgress(100);
      setUploadStatus('Processing...');

      if (data.success) {
        setUploadStatus('Complete!');
        setSuccess({
          title: title || `GATE CSE ${year} Set ${setNum}`,
          year,
          set: setNum,
          filename: selectedFile.name,
        });
        fetchPapers();
        setSelectedFile(null);
        setTitle('');
        toast.success('Paper uploaded successfully');
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this paper?')) return;
    try {
      await adminApi.delete(`/admin/pyq-papers/${id}`);
      setPapers((prev) => prev.filter((p) => (p._id || p.id) !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const years = Array.from({ length: 27 }, (_, i) => 2026 - i);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">PYQ Papers Management</h1>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Upload success summary */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">Γ£ô</div>
              <div>
                <div className="text-sm font-semibold text-success">Upload Complete</div>
                <div className="text-xs text-text3 mt-1">{success.title} ΓÇö Year {success.year}, Set {success.set}</div>
              </div>
              <button onClick={() => setSuccess(null)} className="ml-auto text-text3 hover:text-text text-sm">├ù</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-text mb-4">Upload New Paper</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm text-text2 mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text2 mb-1">Set</label>
                <select
                  value={setNum}
                  onChange={(e) => setSetNum(parseInt(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text"
                >
                  {[1, 2, 3].map(s => <option key={s} value={s}>Set {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text2 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`GATE CSE ${year} Set ${setNum}`}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text"
                />
              </div>
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                }`}
              >
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                {selectedFile ? (
                  <div className="text-sm text-primary font-medium">{selectedFile.name}</div>
                ) : (
                  <div className="text-text3 text-sm">
                    <div className="text-2xl mb-2">≡ƒôä</div>
                    Drag & drop PDF here<br />or click to select
                  </div>
                )}
              </div>
              {/* Upload progress */}
              {uploading && (
                <div className="space-y-1">
                  <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-text3">{uploadStatus}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
              >
                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Paper'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-text mb-4">All Papers ({papers.length})</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-text3 text-sm">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading papers...
              </div>
            ) : papers.length === 0 ? (
              <div className="text-center py-8 text-text3">
                <div className="text-3xl mb-2">≡ƒôä</div>
                <p className="text-sm">No papers uploaded yet.</p>
                <p className="text-[10px] text-text3/60 mt-1">Upload your first GATE paper to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div key={paper._id || paper.id} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-medium text-text">{paper.title}</p>
                      <p className="text-sm text-text3">{paper.year} &bull; Set {paper.set}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(paper._id || paper.id)}
                      className="px-3 py-1.5 text-sm bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
