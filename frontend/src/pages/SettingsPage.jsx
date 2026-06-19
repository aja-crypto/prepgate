// Settings: exports, backups, resets, theme, notifications, PWA
import { useState, useRef, useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { exportToCsv, exportToExcel } from '../utils/exportUtils';
import { requestNotificationPermission } from '../utils/reminderUtils';
import { authService, progressService, getApiErrorMessage } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import toast from 'react-hot-toast';

function BackupIndicator({ status, lastBackupAt }) {
  const statusMap = {
    saved: { color: 'text-green-400', dot: 'bg-green-400', label: 'Saved locally' },
    saving: { color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse', label: 'Saving...' },
    error: { color: 'text-red-400', dot: 'bg-red-400', label: 'Save failed' },
  };
  const s = statusMap[status] || statusMap.saved;
  const timeStr = lastBackupAt
    ? new Date(lastBackupAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      <span className={`text-xs ${s.color}`}>{s.label}</span>
      <span className="text-[10px] text-text3">· Last: {timeStr}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user, deleteAccount, setUser } = useAuth();
  const { themeMode, setThemeMode, colorPreset, setColorPreset, colorPresets, resetOnboarding } = useTheme();
  const {
    backupStatus, lastBackupAt, cloudBackupStatus, lastCloudBackupAt, mongoAvailable, syncToCloud,
    resetAllProgress, resetSubjectProgress, resetTopicProgress, restoreFromSnapshot,
    importUserData, getExportPayload,
    gateFeatures, updateGateFeatures, notifications, updateNotifications,
    studyStats, topics,
  } = useProgress();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubjectReset, setShowSubjectReset] = useState(false);
  const [showTopicReset, setShowTopicReset] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [examDate, setExamDate] = useState(gateFeatures.examDate.slice(0, 10));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [deletePwd, setDeletePwd] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    progressService.getSnapshots().then((res) => setSnapshots(res.data?.data || [])).catch(silentCatch('Load snapshots'));
  }, []);

  const handleReset = async () => {
    setResetting(true);
    await resetAllProgress();
    setResetting(false);
    setShowResetModal(false);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importUserData(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      updateNotifications((n) => ({ ...n, pushEnabled: true }));
      toast.success('Notifications enabled');
    } else if (perm === 'denied') {
      toast.error('Notifications blocked — enable in browser settings');
    } else {
      toast.error('Notifications not supported');
    }
  };

  const installPwa = () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; });
    } else {
      toast('Install via browser menu → "Add to Home Screen"', { icon: '📱' });
    }
  };

  const cards = [
    {
      title: '🎨 Appearance & Theme',
      desc: 'Dark, light, or system theme. Customize accent colors.',
      action: (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Theme mode</div>
            <div className="flex flex-wrap gap-2">
              {['dark', 'light', 'system'].map((m) => (
                <button
                  key={m}
                  onClick={() => setThemeMode(m)}
                  className={`text-xs px-4 py-2 rounded-xl border capitalize transition-all ${themeMode === m ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-text2 hover:bg-hover'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Accent palette</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(colorPresets).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setColorPreset(p.id)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${colorPreset === p.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/20'}`}
                >
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ background: p.primary }} />
                  <span className="text-xs text-text">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={resetOnboarding} className="text-[10px] text-text3 hover:text-primary transition-colors">
            Replay welcome tour
          </button>
        </div>
      ),
    },
    {
      title: '👤 Account',
      desc: 'Email verification, password, and account management.',
      action: (
        <div className="space-y-3">
          <div className="text-xs text-text2">
            <span className="text-text3">Email:</span> {user?.email}
            {user?.isVerified
              ? <span className="ml-2 text-green-400">✓ Verified</span>
              : <span className="ml-2 text-yellow-400">Unverified</span>}
          </div>
          {!user?.isVerified && (
            <button
              onClick={async () => {
                try {
                  const res = await authService.resendVerification();
                  setUser((u) => (u ? { ...u, isVerified: true } : u));
                  toast.success(res.data?.message || 'Verification email sent');
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Could not send verification email'));
                }
              }}
              className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg"
            >
              Resend Verification Email
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowChangePassword(true)} className="text-xs bg-bg-2 border border-border px-3 py-2 rounded-lg text-text2 hover:border-white/15">🔑 Change Password</button>
            <button onClick={() => setShowDeleteAccount(true)} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg">🗑 Delete Account</button>
          </div>
        </div>
      ),
    },
    {
      title: '⏳ GATE Exam Date',
      desc: 'Configure the countdown target date for GATE 2027.',
      action: (
        <div className="space-y-3">
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full max-w-xs bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          <button onClick={() => { updateGateFeatures((gf) => ({ ...gf, examDate: `${examDate}T09:00:00` })); toast.success('GATE exam date updated'); }} className="text-xs bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/15">Save Exam Date</button>
        </div>
      ),
    },
    {
      title: '💾 Auto Backup & Import',
      desc: 'Local auto-save + cloud backup (MongoDB). Import/export JSON data.',
      action: (
        <div className="space-y-3">
          <BackupIndicator status={backupStatus} lastBackupAt={lastBackupAt} />
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${cloudBackupStatus === 'synced' ? 'bg-green-400' : cloudBackupStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-text3'}`} />
            <span className="text-text3">
              Cloud{mongoAvailable ? ' (MongoDB)' : ''}: {cloudBackupStatus === 'synced' ? 'Synced' : cloudBackupStatus === 'syncing' ? 'Syncing...' : cloudBackupStatus === 'offline' ? 'Offline (local only)' : 'Idle'}
              {lastCloudBackupAt && ` · ${new Date(lastCloudBackupAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={syncToCloud} className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-lg hover:bg-primary/15">☁️ Sync Now</button>

            <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-bg-2 border border-white/8 rounded-lg px-3 py-2 text-text2 hover:border-white/15">📥 Import Data</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>
      ),
    },
    {
      title: '📥 Export Data',
      desc: 'Export your study data as CSV or Excel for offline analysis.',
      action: (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { exportToCsv(getExportPayload()); toast.success('CSV exported'); }} className="bg-bg-2 border border-white/8 text-text2 text-xs font-semibold px-4 py-2 rounded-lg hover:border-white/15">📊 CSV</button>
          <button onClick={() => { try { exportToExcel(getExportPayload()); toast.success('Excel exported'); } catch { toast.error('Excel export failed'); } }} className="bg-bg-2 border border-white/8 text-text2 text-xs font-semibold px-4 py-2 rounded-lg hover:border-white/15">📗 Excel</button>
        </div>
      ),
    },
    {
      title: '🔔 Reminders & Notifications',
      desc: 'Daily study, revision, mock test, and goal completion reminders.',
      action: (
        <div className="space-y-3">
          <button onClick={enableNotifications} className="text-xs bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/15">
            {notifications.pushEnabled ? '✓ Notifications On' : 'Enable Notifications'}
          </button>
          {['dailyStudy', 'revision', 'mockTest', 'goalCompletion'].map((key) => (
            <label key={key} className="flex items-center justify-between text-xs text-text2">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                type="checkbox"
                checked={notifications[key]?.enabled ?? false}
                onChange={(e) => updateNotifications((n) => ({ ...n, [key]: { ...n[key], enabled: e.target.checked } }))}
                className="accent-primary"
              />
            </label>
          ))}
          {notifications.dailyStudy?.enabled && (
            <input
              type="time"
              value={notifications.dailyStudy.time}
              onChange={(e) => updateNotifications((n) => ({ ...n, dailyStudy: { ...n.dailyStudy, time: e.target.value } }))}
              className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text"
            />
          )}
        </div>
      ),
    },
    {
      title: '📱 Install as App (PWA)',
      desc: 'Install PrepGate on your phone or desktop for offline access.',
      action: (
        <button onClick={installPwa} className="btn-ghost text-xs">Install App</button>
      ),
    },
    {
      title: '♻️ Restore Progress',
      desc: 'Recover deleted progress within 30 days of reset.',
      action: snapshots.length ? (
        <div className="space-y-2">
          {snapshots.map((s) => (
            <div key={s._id} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg p-3">
              <div>
                <div className="text-xs text-text">{s.reason === 'reset' ? 'Progress Reset' : 'Account Deletion'}</div>
                <div className="text-[10px] text-text3">{new Date(s.deletedAt).toLocaleDateString('en-IN')} · expires {new Date(s.expiresAt).toLocaleDateString('en-IN')}</div>
              </div>
              <button
                onClick={async () => { await restoreFromSnapshot(s._id); progressService.getSnapshots().then((r) => setSnapshots(r.data?.data || [])); }}
                className="text-[10px] text-primary hover:underline"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-text3">No recoverable snapshots. Snapshots are created when you reset progress.</div>
      ),
    },
    {
      title: '🔄 Reset Progress',
      desc: 'Reset all, per-subject, or per-topic progress.',
      action: (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowResetModal(true)} className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-500/15">Reset All</button>
          <button onClick={() => setShowSubjectReset(true)} className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-500/15">Reset Subject</button>
          <button onClick={() => setShowTopicReset(true)} className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-500/15">Reset Topic</button>
        </div>
      ),
      danger: true,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Settings</h1>
        <p className="text-sm text-text3 mt-0.5">Manage exports, backups, and preferences for {user?.name?.split(' ')[0]}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.title} className={`bg-surface border rounded-xl p-5 ${c.danger ? 'border-red-500/15' : 'border-white/5'}`}>
            <div className="text-sm font-semibold text-text mb-1">{c.title}</div>
            <p className="text-xs text-text3 mb-4 leading-relaxed">{c.desc}</p>
            {c.action}
          </div>
        ))}
      </div>

      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title="⚠️ Reset All Progress?">
        <p className="text-sm text-text2 mb-5 leading-relaxed">This will permanently delete all study progress. Your account remains intact.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowResetModal(false)} className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={handleReset} disabled={resetting} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">{resetting ? 'Resetting...' : 'Yes, Reset Everything'}</button>
        </div>
      </Modal>

      <Modal open={showSubjectReset} onClose={() => setShowSubjectReset(false)} title="Reset Subject Progress">
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text mb-4">
          <option value="">Select subject...</option>
          {studyStats.subjects.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={() => setShowSubjectReset(false)} className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={() => { if (selectedSubject) { resetSubjectProgress(selectedSubject); setShowSubjectReset(false); } }} disabled={!selectedSubject} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">Reset Subject</button>
        </div>
      </Modal>

      <Modal open={showTopicReset} onClose={() => setShowTopicReset(false)} title="Reset Topic Progress">
        <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text mb-4">
          <option value="">Select topic...</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={() => setShowTopicReset(false)} className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={() => { if (selectedTopic) { resetTopicProgress(Number(selectedTopic)); setShowTopicReset(false); } }} disabled={!selectedTopic} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">Reset Topic</button>
        </div>
      </Modal>

      <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Password">
        <div className="space-y-3">
          <input type="password" placeholder="Current password" value={pwdForm.current} onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <input type="password" placeholder="New password (8+ chars)" value={pwdForm.newPwd} onChange={(e) => setPwdForm((f) => ({ ...f, newPwd: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <input type="password" placeholder="Confirm new password" value={pwdForm.confirm} onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text" />
          <button
            onClick={async () => {
              if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('Passwords do not match');
              if (pwdForm.newPwd.length < 8) return toast.error('Password must be 8+ characters');
              try {
                await authService.changePassword(pwdForm.current, pwdForm.newPwd);
                toast.success('Password changed');
                setShowChangePassword(false);
                setPwdForm({ current: '', newPwd: '', confirm: '' });
              } catch (err) { toast.error(getApiErrorMessage(err, 'Password change failed')); }
            }}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold"
          >
            Update Password
          </button>
        </div>
      </Modal>

      <Modal open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title="⚠️ Delete Account?">
        <p className="text-sm text-text2 mb-4">Your data will be saved for 30 days before permanent deletion. Enter your password to confirm.</p>
        <input type="password" placeholder="Your password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text mb-4" />
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteAccount(false)} className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-lg text-sm">Cancel</button>
          <button
            onClick={async () => {
              try { await deleteAccount(deletePwd); }
              catch (err) { toast.error(getApiErrorMessage(err, 'Delete failed')); }
            }}
            disabled={!deletePwd && user?.authProvider !== 'google'}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            Delete Account
          </button>
        </div>
      </Modal>
    </div>
  );
}
