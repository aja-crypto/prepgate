import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { ScrollNavSettings } from '../components/common/SmartScrollNavigator';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { exportToCsv, exportToExcel } from '../utils/exportUtils';
import { requestNotificationPermission } from '../utils/reminderUtils';
import { authService, progressService, referralService, getApiErrorMessage } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const TARGET = 2;
const REWARDS = [
  { key: 'predictor', label: 'Full Predictor', icon: '🎯', minReferrals: 1 },
  { key: 'pdf', label: 'Complete PDF', icon: '📄', minReferrals: 2 },
  { key: 'choiceFilling', label: 'Choice Filling', icon: '📋', minReferrals: 2 },
  { key: 'aiMentor', label: 'AI Mentor', icon: '🤖', minReferrals: 2 },
];

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

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-6 rounded-full shrink-0 transition-all duration-300"
      style={{
        background: enabled
          ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
          : 'rgba(100,116,139,0.25)',
        boxShadow: enabled ? '0 0 12px rgba(139,92,246,0.35)' : 'none',
      }}
      aria-label={`Toggle ${enabled ? 'off' : 'on'}`}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
        style={{
          left: enabled ? 'calc(100% - 22px)' : '2px',
          boxShadow: enabled ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, deleteAccount, logout, setUser, isPremium, referralCount, referralProgress, refreshReferralStatus } = useAuth();
  const { themeMode, setThemeMode, colorPreset, setColorPreset, colorPresets, resetOnboarding } = useTheme();
  const {
    backupStatus, lastBackupAt, cloudBackupStatus, mongoAvailable, syncToCloud,
    resetAllProgress, restoreFromSnapshot,
    gateFeatures, updateGateFeatures, notifications, updateNotifications,
    getExportPayload, studyStats,
  } = useProgress();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [examDate, setExamDate] = useState((gateFeatures?.examDate || '2027-02-07T09:00:00').slice(0, 10));
  const [deletePwd, setDeletePwd] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const fileInputRef = useRef(null);

  const [aiFabEnabled, setAiFabEnabled] = useState(() => localStorage.getItem('gatenexa_ai_fab') !== 'false');
  const [showTooltip, setShowTooltip] = useState(() => localStorage.getItem('gatenexa_ai_tooltip') !== 'false');
  const [focusModeEnabled, setFocusModeEnabled] = useState(() => localStorage.getItem('gatenexa_focus_enabled') !== 'false');
  const [focusDuration, setFocusDuration] = useState(() => parseInt(localStorage.getItem('gatenexa_focus_duration'), 10) || 25);
  const [dailyGoalHours, setDailyGoalHours] = useState(gateFeatures?.dailyTarget?.hours || 2);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });

  // Profile form state
  const [collapsedSections, setCollapsedSections] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name || '');
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(user?.avatar || '');
  const [savingAvatar, setSavingAvatar] = useState(false);


  // Referral state
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const todaySessions = (() => { try { return JSON.parse(localStorage.getItem('gatenexa_focus_sessions') || '[]'); } catch { return []; } })().filter(
    (s) => new Date(s.date).toDateString() === new Date().toDateString()
  );
  const todayFocusMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const lastFocusDuration = todaySessions[todaySessions.length - 1]?.duration || null;

  useEffect(() => {
    progressService.getSnapshots().then((res) => setSnapshots(res.data?.data || [])).catch(silentCatch('Load snapshots'));
  }, []);

  useEffect(() => {
    if (user) {
      setNameDraft(user.name || '');
      setAvatarUrl(user.avatar || '');
      setAvatarDraft(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (referralCode || !user) return;
    referralService.getStatus().then(res => {
      const d = res.data?.data;
      if (d?.referralCode) setReferralCode(d.referralCode);
    }).catch(() => {});
  }, [user, referralCode]);

  useEffect(() => {
    if (referralCode && !referralLink) {
      const base = window.location.origin;
      setReferralLink(`${base}/register?ref=${referralCode}`);
    }
  }, [referralCode, referralLink]);

  const toggleAiFab = (enabled) => {
    setAiFabEnabled(enabled);
    localStorage.setItem('gatenexa_ai_fab', String(enabled));
    toast.success(enabled ? 'AI Assistant visible' : 'AI Assistant hidden');
  };

  const toggleTooltip = (enabled) => {
    setShowTooltip(enabled);
    localStorage.setItem('gatenexa_ai_tooltip', String(enabled));
  };

  const toggleFocusMode = (enabled) => {
    setFocusModeEnabled(enabled);
    localStorage.setItem('gatenexa_focus_enabled', String(enabled));
    toast.success(enabled ? 'Focus mode enabled' : 'Focus mode disabled');
  };

  const handleFocusDuration = (dur) => {
    setFocusDuration(dur);
    localStorage.setItem('gatenexa_focus_duration', String(dur));
    toast.success(`Focus timer set to ${dur} min`);
  };

  const handleReset = async () => {
    if (resetConfirmText !== 'DELETE MY DATA') {
      toast.error('Type "DELETE MY DATA" to confirm');
      return;
    }
    setResetting(true);
    await resetAllProgress();
    setResetting(false);
    setShowResetModal(false);
    setResetConfirmText('');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        localStorage.setItem(`gatenexa_progress_${user?.id || user?._id || 'guest'}`, JSON.stringify(data));
        toast.success('Data imported — refresh to apply');
      } catch {
        toast.error('Invalid JSON file');
      }
    };
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
      toast('Install via browser menu → "Add to Home Screen"', { icon: '\u{1F4F1}' });
    }
  };

  const handleDailyGoalSave = () => {
    updateGateFeatures((gf) => ({
      ...gf,
      dailyTarget: { ...gf.dailyTarget, hours: dailyGoalHours },
    }));
    toast.success('Daily goal updated');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft === user?.name) {
      setEditingName(false);
      return;
    }
    try {
      const res = await authService.updateProfile({ name: nameDraft.trim() });
      setUser(res.data.data.user);
      toast.success('Name updated');
      setEditingName(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update name'));
    }
  };

  const saveAvatar = async () => {
    if (!avatarDraft.trim()) {
      toast.error('Enter an image URL');
      return;
    }
    setSavingAvatar(true);
    try {
      const res = await authService.updateAvatar(avatarDraft.trim());
      setUser(res.data.data.user);
      setAvatarUrl(avatarDraft.trim());
      toast.success('Profile picture updated');
      setEditingAvatar(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update avatar'));
    }
    setSavingAvatar(false);
  };

  const handleChangeEmail = async () => {
    if (!emailForm.newEmail.trim()) return toast.error('Enter a new email');
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailForm.newEmail)) return toast.error('Invalid email format');
    try {
      const res = await authService.changeEmail(emailForm.newEmail.trim(), emailForm.password);
      toast.success(res.data.message || 'Verification sent to new email');
      setShowChangeEmail(false);
      setEmailForm({ newEmail: '', password: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Email change failed'));
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const ta = document.createElement('textarea');
        ta.value = referralLink;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Copy failed'); }
  };

  const sectionTitle = "text-sm font-bold text-text mb-1.5";
  const sectionDesc = "text-[11px] text-text3/70 mb-3.5 leading-relaxed";
  const chipBtn = "text-xs px-3 py-1.5 rounded-full border transition-all";
  const actionBtn = "text-xs bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-[14px] hover:bg-primary/15 transition-all font-medium";
  const ghostBtn = "text-xs bg-bg-2 border border-border px-3.5 py-1.5 rounded-[14px] text-text2 hover:border-white/15 transition-all";
  const inputBase = "bg-bg-2 border border-border rounded-[12px] px-3 py-2 text-xs text-text focus:outline-none focus:border-primary/60 transition-all";

  const sections = [
    // ─── P0: Profile (Name, Email, Avatar, Account Type) ───
    {
      title: 'Profile',
      desc: 'Your name, email, avatar, and account type.',
      content: (
        <div className="space-y-3.5">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-bg-2 border border-border"
              style={{ background: avatarUrl && !editingAvatar ? `url(${avatarUrl}) center/cover` : undefined }}>
              {!avatarUrl || editingAvatar ? (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">
                  {(user?.name || '?')[0].toUpperCase()}
                </div>
              ) : null}
            </div>
            <div className="flex-1">
              {editingAvatar ? (
                <div className="flex gap-2 items-center">
                  <input type="text" value={avatarDraft} placeholder="Paste image URL..."
                    onChange={(e) => setAvatarDraft(e.target.value)} className={inputBase + " flex-1"} />
                  <button onClick={saveAvatar} disabled={savingAvatar}
                    className={actionBtn}>{savingAvatar ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => { setEditingAvatar(false); setAvatarDraft(avatarUrl); }}
                    className="text-[11px] text-text3 hover:text-text2">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditingAvatar(true)} className={ghostBtn}>Change Picture</button>
              )}
            </div>
          </div>
          {/* Name */}
          <div>
            <div className="text-[10px] font-semibold text-text3 uppercase tracking-wider mb-1">Name</div>
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input type="text" value={nameDraft} maxLength={50}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className={inputBase + " flex-1"} autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(user?.name || ''); }}} />
                <button onClick={saveName} className={actionBtn}>Save</button>
                <button onClick={() => { setEditingName(false); setNameDraft(user?.name || ''); }}
                  className="text-[11px] text-text3 hover:text-text2">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text">{user?.name || '—'}</span>
                <button onClick={() => { setEditingName(true); setNameDraft(user?.name || ''); }}
                  className="text-[10px] text-primary/70 hover:text-primary">Edit</button>
              </div>
            )}
          </div>
          {/* Plan badge (under name) */}
          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                ⭐ PREMIUM
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                BASIC
              </span>
            )}
            <span className="text-[11px] text-text3">Plan</span>
          </div>

          {/* Email */}
          <div>
            <div className="text-[10px] font-semibold text-text3 uppercase tracking-wider mb-1">Email</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text">{user?.email}</span>
              {user?.isVerified
                ? <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Verified</span>
                : <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Unverified</span>}
            </div>
            <div className="flex gap-2 mt-1.5">
              <button onClick={() => setShowChangeEmail(true)} className={ghostBtn}>Change Email</button>
              {!user?.isVerified && (
                <button onClick={async () => {
                  try {
                    const res = await authService.resendVerification();
                    toast.success(res.data?.message || 'Verification email sent');
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Could not send verification email'));
                  }
                }} className="text-[11px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-[14px] text-xs">Resend Verification</button>
              )}
            </div>
          </div>
        </div>
      ),
    },

    // ─── P0: Referral Progress + Rewards ───
    {
      title: 'Referral Progress',
      desc: 'Invite friends to unlock Premium for free.',
      content: (
        <div className="space-y-3.5">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text2 font-medium">{referralCount} / {TARGET} Completed</span>
              <span className="text-xs text-text3">{Math.min(100, Math.round((referralCount / TARGET) * 100))}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-bg-2 border border-border overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (referralCount / TARGET) * 100)}%`,
                  background: 'linear-gradient(90deg, #8B5CF6, #A855F7)',
                }} />
            </div>
          </div>
          {/* Rewards checklist */}
          <div className="space-y-1">
            {REWARDS.map((r) => {
              const unlocked = isPremium || referralCount >= r.minReferrals;
              return (
                <div key={r.key}
                  className={`flex items-center gap-2 rounded-[12px] p-2 transition-all ${unlocked ? 'bg-green-500/5 border border-green-500/15' : 'bg-bg-2 border border-border opacity-50'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${unlocked ? 'bg-green-500 text-white' : 'bg-text3/20 text-text3'}`}>
                    {unlocked ? '✓' : String(r.minReferrals)}
                  </span>
                  <span className="text-xs text-text2">{r.icon} {r.label}</span>
                  {!unlocked && !isPremium && (
                    <span className="ml-auto text-[10px] text-text3">{r.minReferrals} friend{r.minReferrals > 1 ? 's' : ''}</span>
                  )}
                  {isPremium && unlocked && (
                    <span className="ml-auto text-[10px] text-green-400">Unlocked</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Invite button */}
          <div className="flex gap-2">
            <button onClick={() => navigate('/referral')} className="flex-1 bg-primary/15 border border-primary/25 text-primary text-[12px] font-semibold py-2 rounded-[14px] hover:bg-primary/20 transition-all">
              🎁 Invite Friends
            </button>
            {referralLink && (
              <button onClick={copyToClipboard} className="bg-bg-2 border border-border text-text2 text-[12px] px-3 py-2 rounded-[14px] hover:border-primary/30 transition-all">
                {copied ? '✓ Copied' : '🔗 Copy Link'}
              </button>
            )}
          </div>
          {/* Referral code display */}
          {referralCode && (
            <div className="bg-bg-2 border border-border rounded-[12px] p-2.5">
              <div className="text-[9px] text-text3 uppercase tracking-wider mb-1">Your Code</div>
              <div className="text-sm font-bold tracking-[0.2em] text-primary">{referralCode}</div>
            </div>
          )}
        </div>
      ),
    },

    // ─── P0: Security ───
    {
      title: 'Security',
      desc: 'Password, login activity, and account protection.',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text2">Password</span>
            <button onClick={() => setShowChangePassword(true)} className={ghostBtn}>Change</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text2">Two-Factor Auth (2FA)</span>
            <span className="text-[10px] text-text3/60 italic">Coming soon</span>
          </div>
          {user?.lastLogin && (
            <div className="text-[10px] text-text3">
              Last login: {new Date(user.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <div className="border-t border-border pt-2 mt-1 flex gap-2">
            <button onClick={() => setShowDeleteAccount(true)}
              className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-[14px] hover:bg-red-500/15 transition-all">
              Delete Account
            </button>
            <button onClick={handleLogout}
              className="text-[11px] bg-bg-2 border border-border text-text2 px-3 py-1.5 rounded-[14px] hover:border-white/15 transition-all">
              Logout
            </button>
          </div>
        </div>
      ),
    },

    // ─── Quick Links ───
    {
      title: 'Quick Links',
      desc: 'Navigate to key areas.',
      content: (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/dashboard')}
            className="text-xs bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-[14px] hover:bg-primary/15 transition-all font-medium flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd" /></svg>
            Dashboard
          </button>
          <button onClick={() => navigate('/subjects')}
            className="text-xs bg-bg-2 border border-border px-3.5 py-1.5 rounded-[14px] text-text2 hover:border-primary/30 transition-all font-medium flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" clipRule="evenodd" /></svg>
            Subjects
          </button>
          <button onClick={() => navigate('/pyq')}
            className="text-xs bg-bg-2 border border-border px-3.5 py-1.5 rounded-[14px] text-text2 hover:border-primary/30 transition-all font-medium flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4 4h12v12H4V4zm2 2h8v2H6V6zm0 4h8v2H6v-2zm0 4h5v2H6v-2z" clipRule="evenodd" /></svg>
            PYQs
          </button>
          <button onClick={() => navigate('/')}
            className="text-xs bg-bg-2 border border-border px-3.5 py-1.5 rounded-[14px] text-text2 hover:border-primary/30 transition-all font-medium flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd" /></svg>
            Visit Homepage
          </button>
        </div>
      ),
    },
    {
      title: 'Appearance',
      desc: 'Dark, light, or system theme.',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {['dark', 'light', 'system'].map((m) => (
            <button key={m} onClick={() => setThemeMode(m)}
              className={`${chipBtn} ${themeMode === m ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-text2 hover:bg-hover'}`}>
              {m}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Accent',
      desc: 'Customize accent colors.',
      content: (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(colorPresets).map((p) => (
              <button key={p.id} onClick={() => setColorPreset(p.id)}
                className={`flex items-center gap-2 rounded-[14px] border p-2.5 text-left transition-all ${colorPreset === p.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/20'}`}>
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: p.primary }} />
                <span className="text-[11px] text-text truncate">{p.label}</span>
              </button>
            ))}
          </div>
          <button onClick={resetOnboarding} className="text-[10px] text-text3 hover:text-primary transition-colors">
            Replay welcome tour
          </button>
        </div>
      ),
    },
    {
      title: 'Scroll Navigator',
      desc: 'Custom floating scroll indicator with section markers.',
      content: <ScrollNavSettings />,
    },
    {
      title: 'AI Assistant',
      desc: 'Control the floating AI assistant across the app.',
      content: (
        <div className="space-y-3">
          <label className="flex items-center justify-between text-[12px] text-text2 cursor-pointer">
            <span>Floating Assistant</span>
            <Toggle enabled={aiFabEnabled} onChange={toggleAiFab} />
          </label>
          <label className="flex items-center justify-between text-[12px] text-text2 cursor-pointer">
            <span>Show Tooltip</span>
            <Toggle enabled={showTooltip} onChange={toggleTooltip} />
          </label>
        </div>
      ),
    },
    {
      title: 'Focus',
      desc: 'Configure focus timer and study mode.',
      content: (
        <div className="space-y-3">
          <label className="flex items-center justify-between text-[12px] text-text2 cursor-pointer">
            <span>Enable Focus Mode</span>
            <Toggle enabled={focusModeEnabled} onChange={toggleFocusMode} />
          </label>
          {focusModeEnabled && (
            <>
              <div>
                <div className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Timer Duration</div>
                <div className="flex flex-wrap gap-1.5">
                  {[15, 25, 45, 60].map((d) => (
                    <button key={d} onClick={() => handleFocusDuration(d)}
                      className={`${chipBtn} text-[11px] ${focusDuration === d ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-text2 hover:bg-hover'}`}>
                      {d}m
                    </button>
                  ))}
                  <input type="number" min={1} max={180} value={focusDuration}
                    onChange={(e) => handleFocusDuration(parseInt(e.target.value, 10) || 25)}
                    className="!w-16 !rounded-full !px-2.5 !py-1.5 !text-[11px] !text-center !bg-bg-2 !border !border-border focus:!border-primary/60"
                    placeholder="Custom" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text3 pt-1 border-t border-white/5">
                {todayFocusMinutes > 0 && <span>Today: {Math.round(todayFocusMinutes)}m</span>}
                {lastFocusDuration && <span>Last: {lastFocusDuration}m</span>}
                <span className="text-[10px]">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Notifications',
      desc: 'Study reminders and test alerts.',
      content: (
        <div className="space-y-2.5">
          <button onClick={enableNotifications} className={`${actionBtn}`}>
            {notifications.pushEnabled ? '\u2713 Notifications On' : 'Enable Notifications'}
          </button>
          {['dailyStudy', 'revision', 'mockTest', 'goalCompletion'].map((key) => (
            <label key={key} className="flex items-center justify-between text-[12px] text-text2">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input type="checkbox" checked={notifications[key]?.enabled ?? false}
                onChange={(e) => updateNotifications((n) => ({ ...n, [key]: { ...n[key], enabled: e.target.checked } }))}
                className="accent-primary rounded-[4px]" />
            </label>
          ))}
          {notifications.dailyStudy?.enabled && (
            <input type="time" value={notifications.dailyStudy.time}
              onChange={(e) => updateNotifications((n) => ({ ...n, dailyStudy: { ...n.dailyStudy, time: e.target.value } }))}
              className={`${inputBase} max-w-[140px]`} />
          )}
        </div>
      ),
    },
    {
      title: 'Daily Goal',
      desc: 'Set your daily study target.',
      content: (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <input type="number" min={1} max={24} value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(Number(e.target.value) || 2)}
              className={`${inputBase} w-20`} />
            <span className="text-[11px] text-text3">hours/day</span>
          </div>
          <button onClick={handleDailyGoalSave} className={`${actionBtn}`}>Save Goal</button>
        </div>
      ),
    },
    {
      title: 'Exam Date',
      desc: 'Configure the countdown target date for GATE 2027.',
      content: (
        <div className="space-y-2.5">
          <input type="date" value={examDate}
            onChange={(e) => setExamDate(e.target.value)} className={`${inputBase} w-full`} />
          <button onClick={() => { updateGateFeatures((gf) => ({ ...gf, examDate: `${examDate}T09:00:00` })); toast.success('GATE exam date updated'); }}
            className={`${actionBtn}`}>Save Exam Date</button>
        </div>
      ),
    },
    {
      title: 'Export',
      desc: 'Export your study data for offline analysis.',
      content: (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { exportToCsv(getExportPayload()); toast.success('CSV exported'); }}
            className={`${ghostBtn}`}>CSV</button>
          <button onClick={async () => { try { await exportToExcel(getExportPayload()); toast.success('Excel exported'); } catch { toast.error('Excel export failed'); } }}
            className={`${ghostBtn}`}>Excel</button>
        </div>
      ),
    },
    {
      title: 'Install App',
      desc: 'Install GateNexa on your device for offline access.',
      content: (
        <button onClick={installPwa} className={`${actionBtn}`}>Install App</button>
      ),
    },
    {
      title: 'Progress',
      desc: 'Backup, restore, and manage your study data.',
      content: (
        <div className="space-y-2.5">
          <BackupIndicator status={backupStatus} lastBackupAt={lastBackupAt} />
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${cloudBackupStatus === 'synced' ? 'bg-green-400' : cloudBackupStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-text3'}`} />
            <span className="text-text3">
              Cloud{mongoAvailable ? ' (MongoDB)' : ''}: {cloudBackupStatus === 'synced' ? 'Synced' : cloudBackupStatus === 'syncing' ? 'Syncing...' : 'Idle'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={syncToCloud} className={`${actionBtn}`}>Sync Now</button>
            <button onClick={() => fileInputRef.current?.click()} className={`${ghostBtn}`}>Import</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
          {snapshots.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="text-[10px] font-semibold text-text2 uppercase tracking-wider">Restore Snapshot</div>
              {snapshots.map((s) => (
                <div key={s._id} className="flex items-center justify-between bg-bg-2 border border-border rounded-[14px] p-2.5">
                  <div>
                    <div className="text-[11px] text-text">{s.reason === 'reset' ? 'Progress Reset' : 'Account Deletion'}</div>
                    <div className="text-[9px] text-text3">{new Date(s.deletedAt).toLocaleDateString('en-IN')} · expires {new Date(s.expiresAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <button onClick={async () => { await restoreFromSnapshot(s._id); progressService.getSnapshots().then((r) => setSnapshots(r.data?.data || [])); }}
                    className="text-[9px] text-primary hover:underline">Restore</button>
                </div>
              ))}
            </div>
          )}
          <div className="pt-1.5 border-t border-white/5">
            <button onClick={() => setShowResetModal(true)} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold px-3.5 py-1.5 rounded-[14px] hover:bg-red-500/15 transition-all">
              Reset All Progress
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="px-3 sm:px-0">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-text">Settings</h1>
        <p className="text-xs sm:text-sm text-text3/70 mt-0.5">Manage your profile, preferences, and account</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {sections.map((s) => {
          const isCollapsed = collapsedSections[s.title];
          return (
          <div key={s.title}
            className="bg-surface border border-white/5 rounded-[24px] p-4 flex flex-col">
            <button onClick={() => setCollapsedSections(prev => ({ ...prev, [s.title]: !prev[s.title] }))}
              className="flex items-center justify-between w-full text-left sm:cursor-default">
              <div className="flex-1">
                <div className={sectionTitle}>{s.title}</div>
                <p className={sectionDesc}>{s.desc}</p>
              </div>
              <svg viewBox="0 0 20 20" fill="currentColor"
                className={`w-4 h-4 text-text3 sm:hidden transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {!isCollapsed && <div className="flex-1 mt-3">{s.content}</div>}
          </div>
          );
        })}
      </div>

      <Modal open={showResetModal} onClose={() => { setShowResetModal(false); setResetConfirmText(''); }} title="Reset All Progress?">
        <p className="text-sm text-text2 mb-3 leading-relaxed">This will permanently delete all study progress. Your account remains intact.</p>
        <p className="text-xs text-text3 mb-3">Type <strong className="text-red-400">DELETE MY DATA</strong> to confirm:</p>
        <input type="text" value={resetConfirmText} onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder="DELETE MY DATA"
          className={inputBase + " w-full mb-4"} />
        <div className="flex gap-3">
          <button onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
            className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-[14px] text-sm">Cancel</button>
          <button onClick={handleReset} disabled={resetting || resetConfirmText !== 'DELETE MY DATA'}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-[14px] text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">{resetting ? 'Resetting...' : 'Reset Everything'}</button>
        </div>
      </Modal>

      <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Password">
        <div className="space-y-3">
          <input type="password" placeholder="Current password" value={pwdForm.current}
            onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))} className={inputBase + " w-full"} />
          <input type="password" placeholder="New password (8+ chars)" value={pwdForm.newPwd}
            onChange={(e) => setPwdForm((f) => ({ ...f, newPwd: e.target.value }))} className={inputBase + " w-full"} />
          <input type="password" placeholder="Confirm new password" value={pwdForm.confirm}
            onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))} className={inputBase + " w-full"} />
          <button onClick={async () => {
              if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('Passwords do not match');
              if (pwdForm.newPwd.length < 8) return toast.error('Password must be 8+ characters');
              try {
                await authService.changePassword(pwdForm.current, pwdForm.newPwd);
                toast.success('Password changed');
                setShowChangePassword(false);
                setPwdForm({ current: '', newPwd: '', confirm: '' });
              } catch (err) { toast.error(getApiErrorMessage(err, 'Password change failed')); }
            }}
            className="w-full bg-primary text-white py-2.5 rounded-[14px] text-sm font-semibold">Update Password</button>
        </div>
      </Modal>

      <Modal open={showChangeEmail} onClose={() => setShowChangeEmail(false)} title="Change Email">
        <p className="text-xs text-text3 mb-4">Enter your new email and confirm with your password.</p>
        <div className="space-y-3">
          <input type="email" placeholder="New email address" value={emailForm.newEmail}
            onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
            className={inputBase + " w-full"} />
          {user?.authProvider === 'local' && (
            <input type="password" placeholder="Current password" value={emailForm.password}
              onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
              className={inputBase + " w-full"} />
          )}
          <button onClick={handleChangeEmail}
            className="w-full bg-primary text-white py-2.5 rounded-[14px] text-sm font-semibold">Send Verification</button>
        </div>
      </Modal>

      <Modal open={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} title="Delete Account?">
        <p className="text-sm text-text2 mb-4">Your data will be saved for 30 days before permanent deletion. Enter your password to confirm.</p>
        <input type="password" placeholder="Your password" value={deletePwd}
          onChange={(e) => setDeletePwd(e.target.value)} className={inputBase + " w-full mb-4"} />
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteAccount(false)}
            className="flex-1 bg-bg-2 border border-white/8 text-text2 py-2.5 rounded-[14px] text-sm">Cancel</button>
          <button onClick={async () => {
              try { await deleteAccount(deletePwd); }
              catch (err) { toast.error(getApiErrorMessage(err, 'Delete failed')); }
            }}
            disabled={!deletePwd && user?.authProvider !== 'google'}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-[14px] text-sm font-semibold disabled:opacity-60">Delete Account</button>
        </div>
      </Modal>
    </div>
  );
}
