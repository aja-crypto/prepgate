import { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../services/adminApi';
import GlassCard from '../../components/ui/GlassCard';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';

const PAGE_SIZE = 50;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(val), 300);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.get('/admin/users', { params });
      setUsers(res.data.data || []);
      setTotal(res.data.count || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusToggle = async (user) => {
    try {
      await adminApi.put(`/admin/users/${user._id || user.id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'suspended' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await adminApi.put(`/admin/users/${user._id || user.id}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.name}"? This is a soft delete.`)) return;
    try {
      await adminApi.delete(`/admin/users/${user._id || user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">User Management</h1>
          <p className="text-sm text-text3">{total} total users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => { handleSearchChange(e); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/40"
        >
          <option value="">All users</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text3">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-center px-4 py-3 font-semibold">Role</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Streak</th>
                <th className="text-center px-4 py-3 font-semibold">Joined</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text3 text-sm">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text3 text-sm">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id || user.id} className="border-b border-border/50 hover:bg-bg-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                        {(user.name || '?').charAt(0)}
                      </div>
                      <span className="font-medium text-text truncate max-w-[180px]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text2">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="text-[11px] px-2 py-1 rounded bg-bg-3 border border-border text-text focus:outline-none focus:border-primary/40"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.deletedAt ? (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-400">Deleted</span>
                    ) : user.isActive === false ? (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Suspended</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-green-500/10 text-green-400">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-text2">
                    {user.streak?.current || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-text3">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        disabled={!!user.deletedAt}
                        className="p-1.5 rounded-lg hover:bg-bg-3 text-text3 hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.isActive === false ? 'Activate' : 'Suspend'}
                      >
                        <Icon name={user.isActive === false ? 'unlock' : 'lock'} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={!!user.deletedAt}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text3 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Icon name="trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-text3 hover:text-text disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-text3 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-text3 hover:text-text disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
