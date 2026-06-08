// Admin tab for managing and verifying live data updates
import { useState, useEffect } from 'react';
import { adminLiveService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  verified: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  published: 'text-green-400 bg-green-400/10 border-green-400/20',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function AdminLiveDataTab() {
  const [pending, setPending] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState('pending');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, jobsRes] = await Promise.all([
        adminLiveService.getUpdates({ status: filter, limit: 30 }).catch(() => null),
        adminLiveService.getJobs().catch(() => null),
      ]);
      if (pendingRes?.data?.data) setPending(pendingRes.data.data);
      if (jobsRes?.data?.data) setJobs(jobsRes.data.data);
      if (jobsRes?.data?.jobs) setJobList(jobsRes.data.jobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleStatus = async (id, status) => {
    try {
      await adminLiveService.updateStatus(id, status);
      toast.success(`Marked as ${status}`);
      loadData();
    } catch {
      toast.error('Status update failed');
    }
  };

  const handlePublishAll = async () => {
    try {
      const res = await adminLiveService.publishVerified();
      toast.success(`Published ${res.data.data.modified} items`);
      loadData();
    } catch {
      toast.error('Publish failed');
    }
  };

  const handleFetch = async (jobName) => {
    setFetching(true);
    try {
      await adminLiveService.triggerFetch(jobName);
      toast.success(jobName ? `Job "${jobName}" completed` : 'All fetch jobs completed');
      loadData();
    } catch {
      toast.error('Fetch failed — requires MongoDB');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleFetch()} disabled={fetching} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 disabled:opacity-50">
          {fetching ? 'Fetching...' : '↻ Run All Fetch Jobs'}
        </button>
        <button onClick={handlePublishAll} className="text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20">
          ✓ Publish All Verified
        </button>
        {['pending', 'verified', 'published', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Pending updates */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-text mb-4">
          Live Updates ({filter}) — Verify before publishing
        </div>
        {loading ? (
          <div className="text-xs text-text3">Loading...</div>
        ) : pending.length ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pending.map((item) => (
              <div key={item._id} className="flex items-start gap-3 bg-bg-2 border border-border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                    <span className="text-[9px] text-text3">{item.type} · {item.category}</span>
                  </div>
                  <div className="text-sm text-text">{item.title}</div>
                  {item.summary && <div className="text-[11px] text-text3 mt-0.5 line-clamp-2">{item.summary}</div>}
                  <div className="text-[10px] text-text3 mt-1">{item.source} · {new Date(item.fetchedAt).toLocaleString('en-IN')}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {item.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatus(item._id, 'verified')} className="text-[10px] text-blue-400 hover:underline">Verify</button>
                      <button onClick={() => handleStatus(item._id, 'published')} className="text-[10px] text-green-400 hover:underline">Publish</button>
                      <button onClick={() => handleStatus(item._id, 'rejected')} className="text-[10px] text-red-400 hover:underline">Reject</button>
                    </>
                  )}
                  {item.status === 'verified' && (
                    <button onClick={() => handleStatus(item._id, 'published')} className="text-[10px] text-green-400 hover:underline">Publish</button>
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-text3 p-4 bg-bg-2 rounded-lg">No {filter} updates. Run fetch jobs to pull latest data.</div>
        )}
      </div>

      {/* Fetch jobs log */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-text mb-4">Scheduler Jobs</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-text2 mb-2">Configured Jobs</div>
            <div className="space-y-1">
              {jobList.map((j) => (
                <div key={j.name} className="flex items-center justify-between bg-bg-2 rounded px-2.5 py-1.5">
                  <span className="text-[11px] text-text2">{j.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text3">every {j.interval}</span>
                    <button onClick={() => handleFetch(j.name)} disabled={fetching} className="text-[10px] text-primary hover:underline disabled:opacity-50">Run</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text2 mb-2">Recent Job Logs</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {jobs.slice(0, 10).map((log) => (
                <div key={log._id} className="flex items-center justify-between bg-bg-2 rounded px-2.5 py-1.5">
                  <span className="text-[11px] text-text2">{log.jobName}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] text-text3 font-mono">+{log.itemsNew || 0}</span>
                  </div>
                </div>
              ))}
              {!jobs.length && <div className="text-[10px] text-text3">No job logs yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
