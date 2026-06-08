// Admin panel — users, subjects, PYQs, resources with API CRUD
import { useState, useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';
import { adminService, subjectService } from '../services/api';
import Modal from '../components/common/Modal';
import AdminLiveDataTab from '../components/admin/AdminLiveDataTab';
import AdminPYQTab from '../components/admin/AdminPYQTab';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Users', 'Subjects', 'PYQs', 'Resources', 'Live Updates'];

export default function AdminPage() {
  const { topics, pyqs, notes, mocks, resources, studyStats, mongoAvailable } = useProgress();
  const [tab, setTab] = useState('Overview');
  const [apiStats, setApiStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', icon: '📚', color: '#4f8dff' });
  const [editSubjectId, setEditSubjectId] = useState(null);

  const localStats = {
    topics: topics.length,
    completedTopics: topics.filter((t) => t.done).length,
    pyqs: pyqs.length,
    solvedPyqs: pyqs.filter((p) => p.solved).length,
    notes: notes.length,
    mocks: mocks.length,
    resources: resources.length,
    subjects: studyStats.subjects.length,
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, subjectsRes] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getUsers().catch(() => null),
        subjectService.getAll().catch(() => null),
      ]);
      if (statsRes?.data?.data) setApiStats(statsRes.data.data);
      if (usersRes?.data?.data) setUsers(usersRes.data.data);
      if (subjectsRes?.data?.data) setSubjects(subjectsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, [tab]);

  const stats = apiStats || localStats;

  const handleRoleChange = async (userId, role) => {
    try {
      await adminService.updateUserRole(userId, role);
      toast.success(`Role updated to ${role}`);
      loadAdminData();
    } catch {
      toast.error('Failed to update role (requires MongoDB + admin)');
    }
  };

  const saveSubject = async () => {
    if (!subjectForm.name || !subjectForm.code) return;
    try {
      if (editSubjectId) {
        await subjectService.update(editSubjectId, subjectForm);
        toast.success('Subject updated');
      } else {
        await subjectService.create(subjectForm);
        toast.success('Subject created');
      }
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', icon: '📚', color: '#4f8dff' });
      setEditSubjectId(null);
      loadAdminData();
    } catch {
      toast.error('Subject save failed — requires MongoDB admin access');
    }
  };

  const deleteSubject = async (id) => {
    try {
      await subjectService.delete(id);
      toast.success('Subject deactivated');
      loadAdminData();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Admin Panel</h1>
          <p className="text-sm text-text3 mt-0.5">
            Manage users, subjects, and resources
            {mongoAvailable ? ' · MongoDB connected' : ' · Local mode'}
          </p>
        </div>
        <button onClick={loadAdminData} className="text-xs bg-bg-2 border border-border px-3 py-1.5 rounded-lg text-text2 hover:border-white/15">↻ Refresh</button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-4 py-2 rounded-lg border transition-all ${tab === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Users', value: stats.users ?? 1, color: '#f72585' },
            { label: 'Subjects', value: stats.subjects ?? localStats.subjects, color: '#4f8dff' },
            { label: 'Topics', value: stats.topics ?? localStats.topics, color: '#06d6a0' },
            { label: 'PYQs', value: stats.pyqs ?? localStats.pyqs, color: '#ff9f43' },
            { label: 'Notes', value: stats.notes ?? localStats.notes, color: '#a855f7' },
            { label: 'Mock Tests', value: stats.tests ?? localStats.mocks, color: '#06b6d4' },
            { label: 'Completed Topics', value: localStats.completedTopics, color: '#06d6a0' },
            { label: 'Resources', value: localStats.resources, color: '#ffd166' },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Users' && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-4">User Management</div>
          {loading ? <div className="text-xs text-text3">Loading...</div> : users.length ? (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u._id || u.id} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg p-3">
                  <div>
                    <div className="text-sm text-text">{u.name}</div>
                    <div className="text-[11px] text-text3">{u.email}</div>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id || u.id, e.target.value)}
                    className="text-[10px] bg-surface border border-border rounded px-2 py-1 text-text2"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-text3 p-4 bg-bg-2 rounded-lg">Connect MongoDB to manage users. Demo: demo@gate2027.in</div>
          )}
        </div>
      )}

      {tab === 'Subjects' && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-text">Subject Management</div>
            <button onClick={() => { setEditSubjectId(null); setShowSubjectModal(true); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">+ Add Subject</button>
          </div>
          <div className="space-y-2">
            {(subjects.length ? subjects : studyStats.subjects).map((s) => (
              <div key={s._id || s.name} className="flex items-center gap-3 bg-bg-2 border border-border rounded-lg p-3">
                <span>{s.icon}</span>
                <span className="flex-1 text-sm text-text">{s.name}</span>
                <span className="text-xs font-mono text-text3">{s.code || '—'}</span>
                {s._id && (
                  <>
                    <button onClick={() => { setEditSubjectId(s._id); setSubjectForm({ name: s.name, code: s.code, icon: s.icon, color: s.color }); setShowSubjectModal(true); }} className="text-[10px] text-primary hover:underline">Edit</button>
                    <button onClick={() => deleteSubject(s._id)} className="text-[10px] text-red-400 hover:underline">Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'PYQs' && <AdminPYQTab />}

      {tab === 'Resources' && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-4">Resource Management</div>
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg p-3">
                <div>
                  <div className="text-sm text-text">{r.title}</div>
                  <div className="text-[11px] text-text3">{r.subject} · {r.type}</div>
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">Open</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Live Updates' && <AdminLiveDataTab />}

      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)} title={editSubjectId ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-3">
          <input placeholder="Name" value={subjectForm.name} onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <input placeholder="Code (e.g. OS)" value={subjectForm.code} onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <input placeholder="Icon" value={subjectForm.icon} onChange={(e) => setSubjectForm((f) => ({ ...f, icon: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <button onClick={saveSubject} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold">{editSubjectId ? 'Update' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  );
}
