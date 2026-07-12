import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

const CONTENT_TYPES = [
  { id: 'roadmap', label: '🗺️ Roadmaps', color: '#8B5CF6' },
  { id: 'academy', label: '📺 GateNexa Academy', color: '#3B82F6' },
  { id: 'success_story', label: '🚀 Success Stories', color: '#22C55E' },
  { id: 'resource', label: '📚 Resources', color: '#F59E0B' },
  { id: 'update', label: '📢 Updates', color: '#EC4899' },
];

const emptyForm = {
  type: 'academy',
  title: '',
  description: '',
  youtubeUrl: '',
  duration: '',
  difficulty: 'beginner',
  estimatedWatches: '',
  tags: '',
  category: '',
  resourceUrl: '',
  resourceCategory: '',
  resourceType: 'link',
  isFeatured: false,
  isOfficial: false,
  version: '',
  updateType: 'update',
};

export default function AdminLearningHubPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterType ? `?type=${filterType}` : '';
      const res = await adminApi.get(`/learning${params}`);
      setItems(res.data.data || []);
    } catch {
      toast.error('Failed to load content');
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      if (editingId) {
        await adminApi.put(`/learning/${editingId}`, payload);
        toast.success('Content updated');
      } else {
        await adminApi.post('/learning', payload);
        toast.success('Content created');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (item) => {
    setForm({
      type: item.type,
      title: item.title || '',
      description: item.description || '',
      youtubeUrl: item.youtubeUrl || '',
      duration: item.duration || '',
      difficulty: item.difficulty || 'beginner',
      estimatedWatches: item.estimatedWatches || '',
      tags: (item.tags || []).join(', '),
      category: item.category || '',
      resourceUrl: item.resourceUrl || '',
      resourceCategory: item.resourceCategory || '',
      resourceType: item.resourceType || 'link',
      isFeatured: item.isFeatured || false,
      isOfficial: item.isOfficial || false,
      version: item.version || '',
      updateType: item.updateType || 'update',
    });
    setEditingId(item._id || item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    try {
      await adminApi.delete(`/learning/${id}`);
      toast.success('Content deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id, field, value) => {
    try {
      await adminApi.patch(`/learning/${id}/toggle`, { [field]: value });
      fetchItems();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🎓 Learning Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Manage videos, roadmaps, resources, and updates</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...emptyForm }); }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
          {showForm ? '✕ Close' : '+ Add Content'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">{editingId ? 'Edit Content' : 'New Content'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                {CONTENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">YouTube URL</label>
              <input value={form.youtubeUrl} onChange={e => setForm(p => ({ ...p, youtubeUrl: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Duration</label>
              <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} placeholder="e.g. 18 min" />
            </div>
            {form.type === 'roadmap' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Est. Watch Time</label>
                  <input value={form.estimatedWatches} onChange={e => setForm(p => ({ ...p, estimatedWatches: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} placeholder="e.g. 18 min" />
                </div>
              </>
            )}
            {form.type === 'resource' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Resource URL</label>
                  <input value={form.resourceUrl} onChange={e => setForm(p => ({ ...p, resourceUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
                  <input value={form.resourceCategory} onChange={e => setForm(p => ({ ...p, resourceCategory: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
              </>
            )}
            {form.type === 'update' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Update Type</label>
                <select value={form.updateType} onChange={e => setForm(p => ({ ...p, updateType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                  <option value="feature">✨ Feature</option>
                  <option value="improvement">📈 Improvement</option>
                  <option value="fix">🐛 Fix</option>
                  <option value="update">📢 Update</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} placeholder="gate, roadmap, strategy" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} />
                ⭐ Featured
              </label>
              {form.type === 'resource' && (
                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={form.isOfficial} onChange={e => setForm(p => ({ ...p, isOfficial: e.target.checked }))} />
                  ✅ Official
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); }}
              className="px-5 py-2 rounded-xl text-sm font-medium text-slate-500" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterType('')}
          className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${!filterType ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' : 'text-slate-500 border border-transparent hover:text-slate-300'}`}>
          All
        </button>
        {CONTENT_TYPES.map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${filterType === t.id ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25' : 'text-slate-500 border border-transparent hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">No content yet. Click "Add Content" to get started.</div>
        ) : (
          items.map(item => (
            <div key={item._id || item.id} className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg shrink-0">
                {item.type === 'roadmap' ? '🗺️' : item.type === 'academy' ? '📺' : item.type === 'success_story' ? '🚀' : item.type === 'resource' ? '📚' : '📢'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{item.title}</span>
                  {item.isFeatured && <span className="text-[9px]">⭐</span>}
                  {item.isOfficial && <span className="text-[9px]">✅</span>}
                </div>
                {item.description && <p className="text-[11px] text-slate-500 truncate">{item.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggle(item._id || item.id, 'isActive', !item.isActive)}
                  className={`text-[10px] font-medium px-2 py-1 rounded-lg ${item.isActive ? 'text-green-400' : 'text-red-400'}`}
                  style={{ background: item.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${item.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleEdit(item)}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg text-purple-400"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(item._id || item.id)}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg text-red-400"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
