import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';
import Icon from '../../components/ui/Icon';
import { cmsService } from '../../services/adminApi';
import toast from 'react-hot-toast';

const PAGE_SIZE = 15;

const TABS = [
  { key: 'insights', label: 'GATE Insights', icon: 'chart' },
  { key: 'challenges', label: 'Challenges', icon: 'zap' },
  { key: 'motivation', label: 'Motivation', icon: 'heart' },
  { key: 'featured-resources', label: 'Resources', icon: 'book' },
  { key: 'featured-content', label: 'Featured Content', icon: 'star' },
  { key: 'announcements', label: 'Announcements', icon: 'bell' },
];

const TAB_FIELDS = {
  insights: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'month', label: 'Month (YYYY-MM)', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'priority', label: 'Priority (1-10)', type: 'number' },
    { key: 'relatedSubjects', label: 'Related Subjects (comma separated)', type: 'text' },
    { key: 'recommendations', label: 'Recommendations (one per line)', type: 'textarea' },
  ],
  challenges: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'goal', label: 'Goal', type: 'text', required: true },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
    { key: 'rewardBadge', label: 'Reward Badge', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
  ],
  motivation: [
    { key: 'quote', label: 'Quote', type: 'textarea', required: true },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'category', label: 'Category', type: 'select', options: ['daily', 'study_tips', 'success_mindset', 'gate_success', 'motivation'] },
  ],
  'featured-resources': [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'resourceType', label: 'Resource Type', type: 'select', options: ['notes', 'short_notes', 'formula_sheet', 'strategy_guide', 'video', 'pdf'], required: true },
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'subject', label: 'Subject', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'number' },
  ],
  'featured-content': [
    { key: 'contentType', label: 'Content Type', type: 'select', options: ['notes', 'pyq', 'mock_test', 'subject', 'topic'], required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'link', label: 'Link', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'number' },
  ],
  announcements: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'message', label: 'Message', type: 'textarea', required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
    { key: 'notificationEnabled', label: 'Enable Notification', type: 'checkbox' },
  ],
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(item) {
  const published = item.isPublished ?? item.isActive;
  return published !== false
    ? <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">Published</span>
    : <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Draft</span>;
}

// ─── Stats Overview ─────────────────────────────────────────
function CmsStats({ stats, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-bg-2/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  const items = stats ? [
    { label: 'Insights', total: stats.insights?.total || 0, active: stats.insights?.published || 0, color: '#a855f7' },
    { label: 'Challenges', total: stats.challenges?.total || 0, active: stats.challenges?.active || 0, color: '#10b981' },
    { label: 'Motivation', total: stats.motivation?.total || 0, active: stats.motivation?.active || 0, color: '#f59e0b' },
    { label: 'Resources', total: stats.resources?.total || 0, active: stats.resources?.featured || 0, color: '#6366f1' },
    { label: 'Featured', total: stats.featuredContent?.total || 0, active: stats.featuredContent?.published || 0, color: '#ec4899' },
    { label: 'Announcements', total: stats.announcements?.total || 0, active: stats.announcements?.active || 0, color: '#06b6d4' },
  ] : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((item, i) => (
        <GlassCard key={item.label} className="p-4">
          <div className="text-xs text-text3 mb-1">{item.label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold" style={{ color: item.color }}>{item.active}</span>
            <span className="text-xs text-text3">/ {item.total}</span>
          </div>
          <div className="mt-2 w-full h-1 bg-bg-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${item.total ? (item.active / item.total) * 100 : 0}%`, background: item.color }} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── Data Table ─────────────────────────────────────────────
function DataTable({ fields, data, loading, onEdit, onDelete, onTogglePublish, selectedIds, onSelect, onSelectAll }) {
  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-bg-2/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!data.length) return (
    <div className="text-center py-12 text-text3">
      <div className="text-4xl mb-3 opacity-50">📭</div>
      <p>No items found</p>
    </div>
  );

  const columns = fields.filter(f => f.key !== 'description' && f.key !== 'message');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="p-3 text-left">
              <input type="checkbox" onChange={(e) => onSelectAll(e.target.checked)} checked={selectedIds.length === data.length && data.length > 0} className="rounded border-border bg-bg-3" />
            </th>
            {columns.slice(0, 5).map(c => (
              <th key={c.key} className="p-3 text-left text-text3 font-medium">{c.label}</th>
            ))}
            <th className="p-3 text-left text-text3 font-medium">Status</th>
            <th className="p-3 text-right text-text3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="border-b border-border/50 hover:bg-bg-2/30 transition-colors">
              <td className="p-3">
                <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => onSelect(item._id)} className="rounded border-border bg-bg-3" />
              </td>
              {columns.slice(0, 5).map(c => (
                <td key={c.key} className="p-3 text-text max-w-[200px] truncate">
                  {c.type === 'date' ? formatDate(item[c.key]) : c.type === 'checkbox' ? (item[c.key] ? '✓' : '—') : item[c.key] || '—'}
                </td>
              ))}
              <td className="p-3">{getStatusBadge(item)}</td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onTogglePublish(item._id, !(item.isPublished ?? item.isActive))} className="p-1.5 rounded-lg hover:bg-bg-3 text-text3 hover:text-emerald-400" title="Toggle publish">
                    {item.isPublished || item.isActive ? <Icon name="eye-off" size={14} /> : <Icon name="eye" size={14} />}
                  </button>
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-bg-3 text-text3 hover:text-purple-400" title="Edit">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={() => onDelete(item._id)} className="p-1.5 rounded-lg hover:bg-bg-3 text-text3 hover:text-red-400" title="Delete">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Form Modal ─────────────────────────────────────────────
function FormModal({ tab, item, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const init = {};
      const fields = TAB_FIELDS[tab] || [];
      fields.forEach(f => {
        if (f.type === 'date' && item[f.key]) init[f.key] = item[f.key].slice(0, 10);
        else init[f.key] = item[f.key] ?? '';
      });
      setForm(init);
    } else {
      const init = {};
      (TAB_FIELDS[tab] || []).forEach(f => {
        init[f.key] = f.type === 'checkbox' ? false : f.type === 'number' ? 1 : '';
      });
      setForm(init);
    }
  }, [item, tab]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Convert fields
      if (payload.relatedSubjects && typeof payload.relatedSubjects === 'string') {
        payload.relatedSubjects = payload.relatedSubjects.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (payload.recommendations && typeof payload.recommendations === 'string') {
        payload.recommendations = payload.recommendations.split('\n').map(s => s.trim()).filter(Boolean);
      }
      if (payload.priority) payload.priority = Number(payload.priority);

      await onSave(payload);
      toast.success(item ? 'Updated successfully' : 'Created successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const fields = TAB_FIELDS[tab] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-bg shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-bg/95 backdrop-blur-sm">
          <h3 className="font-bold text-text">{item ? 'Edit' : 'Create'} {TABS.find(t => t.key === tab)?.label}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-3 text-text3">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm text-text2 mb-1">
                {f.label}
                {f.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key] || ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required={f.required}
                  rows={4}
                  className="w-full px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500 resize-y"
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.key] || ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required={f.required}
                  className="w-full px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  {(f.options || []).map(o => (
                    <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[f.key] || false}
                    onChange={(e) => handleChange(f.key, e.target.checked)}
                    className="rounded border-border bg-bg-3"
                  />
                  <span className="text-sm text-text2">Enabled</span>
                </label>
              ) : f.type === 'date' ? (
                <input
                  type="date"
                  value={form[f.key] || ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required={f.required}
                  className="w-full px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500"
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required={f.required}
                  className="w-full px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text3 hover:text-text transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
            >
              {saving ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main CMS Page ──────────────────────────────────────────
export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState('insights');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const searchRef = useRef(null);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const res = await cmsService.getStats();
        if (res.data.success) setStats(res.data.data);
      } catch { /* stats silent fail */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (filter) {
        const [key, val] = filter.split(':');
        if (val) params[key] = val;
      }
      const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab] || cmsService.insights;
      const res = await service.list(params);
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load data');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, filter]);

  useEffect(() => { fetchData(); setPage(1); }, [activeTab]);

  // Debounce search
  const handleSearch = (val) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  // CRUD operations
  const handleCreate = () => { setEditingItem(null); setShowForm(true); };

  const handleEdit = (item) => { setEditingItem(item); setShowForm(true); };

  const handleSave = async (payload) => {
    const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab];
    if (editingItem) {
      await service.update(editingItem._id, payload);
    } else {
      await service.create(payload);
    }
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab];
      await service.delete(id);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleTogglePublish = async (id, isPublished) => {
    try {
      const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab];
      await service.togglePublish(id, isPublished);
      toast.success(isPublished ? 'Published' : 'Unpublished');
      fetchData();
    } catch { toast.error('Toggle failed'); }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? items.map(i => i._id) : []);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return toast.error('Select items first');
    if (!window.confirm(`Delete ${selectedIds.length} items?`)) return;
    try {
      const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab];
      await service.bulkDelete(selectedIds);
      toast.success(`Deleted ${selectedIds.length} items`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkPublish = async (publish) => {
    if (!selectedIds.length) return toast.error('Select items first');
    try {
      const service = cmsService[activeTab === 'featured-resources' ? 'featuredResources' : activeTab === 'featured-content' ? 'featuredContent' : activeTab];
      await service.bulkPublish(selectedIds, publish);
      toast.success(`${publish ? 'Published' : 'Unpublished'} ${selectedIds.length} items`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk publish failed'); }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Content Management</h1>
          <p className="text-sm text-text3 mt-1">Manage all homepage content from one dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            <Icon name="plus" size={16} />
            Add New
          </button>
        </div>
      </div>

      {/* Stats */}
      <CmsStats stats={stats} loading={statsLoading} />

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 mb-4 pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-text3 hover:text-text hover:bg-bg-2/50 border border-transparent'
            }`}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500 placeholder:text-text3"
          />
        </div>

        {/* Type filter for resources */}
        {activeTab === 'featured-resources' && (
          <select onChange={(e) => { setFilter(e.target.value ? `resourceType:${e.target.value}` : ''); setPage(1); }} className="px-3 py-2 bg-bg-3 border border-border rounded-lg text-text text-sm focus:outline-none focus:border-purple-500">
            <option value="">All Types</option>
            <option value="notes">Notes</option>
            <option value="short_notes">Short Notes</option>
            <option value="formula_sheet">Formula Sheets</option>
            <option value="strategy_guide">Strategy Guides</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
          </select>
        )}

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text3">{selectedIds.length} selected</span>
            <button onClick={() => handleBulkPublish(true)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Publish</button>
            <button onClick={() => handleBulkPublish(false)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Unpublish</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Delete</button>
          </div>
        )}

        <span className="text-xs text-text3 ml-auto">{total} items</span>
      </div>

      {/* Data Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4">
          <DataTable
            fields={TAB_FIELDS[activeTab] || []}
            data={items}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-bg-3 text-text3 hover:text-text disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-text3">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-bg-3 text-text3 hover:text-text disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </GlassCard>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <FormModal
            tab={activeTab}
            item={editingItem}
            onClose={() => setShowForm(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}