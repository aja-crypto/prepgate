import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminPyqPapersPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [setNum, setSetNum] = useState(1);
  const [title, setTitle] = useState('');

  const fetchPapers = async () => {
    try {
      const res = await fetch('/api/admin/pyq-papers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      if (data.success) setPapers(data.data);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPapers(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.pdf.files[0];
    if (!file) return alert('Select a PDF file');

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('year', year);
    formData.append('set', setNum);
    formData.append('title', title || `GATE CSE ${year} Set ${setNum}`);

    try {
      const res = await fetch('/api/admin/pyq-papers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Paper uploaded successfully!');
        fetchPapers();
        e.target.reset();
        setTitle('');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this paper?')) return;
    try {
      const res = await fetch(`/api/admin/pyq-papers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (res.ok) fetchPapers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const years = Array.from({ length: 27 }, (_, i) => 2026 - i);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">PYQ Papers Management</h1>
      </div>

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
              <div>
                <label className="block text-sm text-text2 mb-1">PDF File</label>
                <input type="file" name="pdf" accept="application/pdf" className="w-full text-text" required />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
              >
                {uploading ? 'Uploading...' : 'Upload Paper'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-text mb-4">All Papers ({papers.length})</h2>
            {loading ? (
              <p className="text-text3">Loading...</p>
            ) : papers.length === 0 ? (
              <p className="text-text3">No papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div key={paper._id || paper.id} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-text">{paper.title}</p>
                      <p className="text-sm text-text3">{paper.year} • Set {paper.set}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(paper._id || paper.id)}
                      className="px-3 py-1.5 text-sm bg-danger/20 text-danger rounded-lg hover:bg-danger/30"
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