import { useState, useEffect, useCallback } from 'react';
import { adminFeedbackService } from '../../services/adminApi';

const CATEGORIES = [
  { value: 'bug_report', label: 'Bug Report', icon: '🐛', color: 'bg-red-500/20 text-red-400' },
  { value: 'feature_request', label: 'Feature Request', icon: '💡', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'question', label: 'Question', icon: '❓', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'suggestion', label: 'Suggestion', icon: '📝', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'appreciation', label: 'Appreciation', icon: '🎉', color: 'bg-green-500/20 text-green-400' },
];

const STATUSES = [
  { value: 'unread', label: 'Unread', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  { value: 'archived', label: 'Archived', color: 'bg-text3/20 text-text3' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-text3' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-400' },
];

const REQUEST_STATUSES = [
  { value: 'planned', label: 'Planned', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
];

function StatCard({ label, value, icon, color = 'text-primary' }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text3 uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, onClose, onUpdated }) {
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [localReplies, setLocalReplies] = useState(ticket.replies || []);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await adminFeedbackService.reply(ticket._id, replyText);
      setLocalReplies(prev => [...prev, res.data.data]);
      setReplyText('');
      onUpdated();
    } catch (e) { console.error(e); }
    finally { setReplying(false); }
  };

  const handleStatus = async (status) => {
    try { await adminFeedbackService.update(ticket._id, { status }); onUpdated(); }
    catch (e) { console.error(e); }
  };

  const handlePriority = async (priority) => {
    try { await adminFeedbackService.update(ticket._id, { priority }); onUpdated(); }
    catch (e) { console.error(e); }
  };

  const cat = CATEGORIES.find(c => c.value === ticket.category);
  const prio = PRIORITIES.find(p => p.value === ticket.priority);
  const status = STATUSES.find(s => s.value === ticket.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg">{cat?.icon}</span>
              <h2 className="text-base font-bold text-text truncate">{ticket.title}</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status?.color}`}>{ticket.status?.replace(/_/g, ' ')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-bg-3 ${prio?.color}`}>{ticket.priority}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-text3 mt-1">
              <span>{ticket.userName} ({ticket.userEmail})</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              {ticket.deviceInfo?.browser && <span>{ticket.deviceInfo.browser} / {ticket.deviceInfo.os}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-text3 hover:text-text p-1 shrink-0 ml-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs text-text3 uppercase mb-1">Message</p>
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {ticket.screenshotUrl && (
            <div>
              <p className="text-xs text-text3 uppercase mb-1">Screenshot</p>
              <img src={ticket.screenshotUrl} alt="Screenshot" className="rounded-lg border border-border max-h-48" />
            </div>
          )}

          {ticket.subject && (
            <div>
              <p className="text-xs text-text3 uppercase mb-1">Subject</p>
              <p className="text-sm text-text">{ticket.subject}</p>
            </div>
          )}

          {/* Reply History */}
          {localReplies.length > 0 && (
            <div>
              <p className="text-xs text-text3 uppercase mb-2">Reply History ({localReplies.length})</p>
              <div className="space-y-3">
                {localReplies.map((r, i) => (
                  <div key={r._id || i} className={`rounded-lg p-3 text-sm ${r.isAdminReply ? 'bg-primary/5 border border-primary/20 ml-6' : 'bg-bg border border-border mr-6'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.isAdminReply ? 'bg-primary/20 text-primary' : 'bg-text3/20 text-text3'}`}>
                        {r.isAdminReply ? 'Admin' : 'User'}
                      </span>
                      <span className="text-[10px] text-text3">{r.author}</span>
                      <span className="text-[10px] text-text3">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-text leading-relaxed whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-[10px] text-text3 uppercase mb-1">Set Status</p>
              <div className="flex gap-1">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => handleStatus(s.value)}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${ticket.status === s.value ? s.color : 'text-text3 hover:text-text bg-bg border border-border'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-text3 uppercase mb-1">Set Priority</p>
              <div className="flex gap-1">
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => handlePriority(p.value)}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${ticket.priority === p.value ? `bg-bg-3 ${p.color}` : 'text-text3 hover:text-text bg-bg border border-border'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input value={replyText} onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder="Type your reply..."
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleReply} disabled={replying || !replyText.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 shrink-0">
              {replying ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newReq, setNewReq] = useState({ title: '', description: '', requestedByName: 'Admin', priority: 'medium' });
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try { const res = await adminFeedbackService.listRequests(); setRequests(res.data.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await adminFeedbackService.createRequest(newReq); setShowCreate(false); setNewReq({ title: '', description: '', requestedByName: 'Admin', priority: 'medium' }); fetchRequests(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await adminFeedbackService.updateRequest(id, { status }); fetchRequests(); }
    catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request?')) return;
    try { await adminFeedbackService.deleteRequest(id); fetchRequests(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text3">{requests.length} feature requests</p>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
          + New Request
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-surface border border-border rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text3">No feature requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const reqStatus = REQUEST_STATUSES.find(s => s.value === r.status);
            return (
              <div key={r._id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[48px]">
                    <div className="text-lg font-bold text-primary">{r.votes || 0}</div>
                    <div className="text-[9px] text-text3 uppercase">votes</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text truncate">{r.title}</h3>
                    {r.description && <p className="text-xs text-text3 mt-0.5 line-clamp-1">{r.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text3">
                      <span>By: {r.requestedByName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select value={r.status} onChange={e => handleStatusUpdate(r._id, e.target.value)}
                      className="bg-bg border border-border rounded-lg px-2 py-1 text-[10px] text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {REQUEST_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => handleDelete(r._id)} className="text-[10px] px-1.5 py-1 text-red-400 hover:bg-red-500/10 rounded-lg">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text mb-4">New Feature Request</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={newReq.title} onChange={e => setNewReq(r => ({ ...r, title: e.target.value }))} required placeholder="Title"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <textarea value={newReq.description} onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))} rows={3} placeholder="Description"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="grid grid-cols-2 gap-3">
                <input value={newReq.requestedByName} onChange={e => setNewReq(r => ({ ...r, requestedByName: e.target.value }))} placeholder="Requested By"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <select value={newReq.priority} onChange={e => setNewReq(r => ({ ...r, priority: e.target.value }))}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text3 hover:text-text rounded-lg border border-border">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFeedbackCenterPage() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', priority: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tab, setTab] = useState('tickets');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;

      const [statsRes, listRes] = await Promise.all([
        adminFeedbackService.getStats(),
        adminFeedbackService.list(params),
      ]);
      setStats(statsRes.data.data);
      setTickets(listRes.data.data);
      setTotalPages(listRes.data.pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTicketUpdate = () => { fetchData(); if (selectedTicket) { setSelectedTicket(null); } };

  const handleDeleteTicket = async (id) => {
    if (!confirm('Delete this ticket and all replies?')) return;
    try { await adminFeedbackService.delete(id); fetchData(); } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">Feedback Center</h1>
          <p className="text-sm text-text3 mt-0.5">Manage user feedback, bug reports, and feature requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('tickets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'tickets' ? 'bg-primary/10 text-primary' : 'text-text3 hover:text-text border border-border'}`}>
            Tickets
          </button>
          <button onClick={() => setTab('requests')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'requests' ? 'bg-primary/10 text-primary' : 'text-text3 hover:text-text border border-border'}`}>
            User Requests
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} icon="📋" />
          <StatCard label="Unread" value={stats.unread} icon="📬" color="text-blue-400" />
          <StatCard label="In Progress" value={stats.pending} icon="⏳" color="text-yellow-400" />
          <StatCard label="Resolved" value={stats.resolved} icon="✅" color="text-green-400" />
          <StatCard label="Critical" value={stats.critical} icon="🚨" color="text-red-400" />
        </div>
      )}

      {tab === 'tickets' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <input value={filter.search} onChange={e => { setFilter(f => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder="Search tickets..."
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 w-52" />
            <select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filter.category} onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setPage(1); }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={filter.priority} onChange={e => { setFilter(f => ({ ...f, priority: e.target.value })); setPage(1); }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <span className="text-xs text-text3 ml-auto">{tickets.length} results</span>
          </div>

          {/* Ticket Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-surface border border-border rounded-xl h-16 animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyFeedbackState />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">User</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Category</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Title</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Date</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Priority</th>
                      <th className="px-4 py-3 text-xs font-medium text-text3 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => {
                      const cat = CATEGORIES.find(c => c.value === t.category);
                      const st = STATUSES.find(s => s.value === t.status);
                      const pr = PRIORITIES.find(p => p.value === t.priority);
                      return (
                        <tr key={t._id} className="border-b border-border hover:bg-bg/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(t)}>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium text-text">{t.userName}</div>
                            <div className="text-[10px] text-text3">{t.userEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat?.color}`}>{cat?.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-text max-w-[200px] truncate">{t.title}</td>
                          <td className="px-4 py-3 text-[10px] text-text3">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st?.color}`}>{st?.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-medium ${pr?.color}`}>{pr?.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={e => { e.stopPropagation(); setSelectedTicket(t); }}
                                className="text-[10px] px-2 py-1 text-primary hover:bg-primary/10 rounded-lg">View</button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteTicket(t._id); }}
                                className="text-[10px] px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg">Del</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs text-text3 hover:text-text border border-border rounded-lg disabled:opacity-30">Prev</button>
              <span className="px-3 py-1 text-xs text-text3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs text-text3 hover:text-text border border-border rounded-lg disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      ) : (
        <RequestsTab />
      )}

      {selectedTicket && <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdated={handleTicketUpdate} />}
    </div>
  );
}

function EmptyFeedbackState() {
  return (
    <div className="bg-surface border border-border rounded-xl p-10 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-sm font-semibold text-text mb-2">No Feedback Yet</h2>
      <p className="text-sm text-text3 max-w-sm mx-auto">When users submit feedback, bug reports, or feature requests, they will appear here.</p>
    </div>
  );
}
