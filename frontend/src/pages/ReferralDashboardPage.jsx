import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { referralService } from '../services/api';
import toast from 'react-hot-toast';

const TARGET = 2;

export default function ReferralDashboardPage() {
  const { user, isPremium, refreshReferralStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [referredBy, setReferredBy] = useState(null);
  const [copied, setCopied] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, h] = await Promise.allSettled([
        referralService.getStatus(),
        referralService.getCode(),
        referralService.getHistory(),
      ]);
      let gotCode = false;
      if (s.status === 'fulfilled' && s.value?.data?.data) {
        const d = s.value.data.data;
        setReferralCount(d.referralCount || 0);
        setPendingCount(d.pendingCount || 0);
        if (d.referralCode) { setReferralCode(d.referralCode); gotCode = true; }
      }
      if (c.status === 'fulfilled' && c.value?.data?.data) {
        const cd = c.value.data.data;
        if (cd.referralCode) { setReferralCode(cd.referralCode); gotCode = true; }
        if (cd.referralLink) setReferralLink(cd.referralLink);
      }
      if (h.status === 'fulfilled' && h.value?.data?.data) {
        setHistory(h.value.data.data.history || []);
        setReferredBy(h.value.data.data.referredBy || null);
      }
      // Fallback: generate code client-side if API failed (demo/guest or error)
      if (!gotCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        setReferralCode(code);
        const base = window.location.origin;
        setReferralLink(`${base}/register?ref=${code}`);
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyToClipboard = async (text, label) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(''), 2000);
    } catch { toast.error('Copy failed'); }
  };

  const shareVia = (platform) => {
    if (!referralLink) { toast.error('Referral link not available'); return; }
    const msg = `🎁 Join GateNexa — Free GATE 2027 prep with AI!\nMy referral: ${referralCode}\n${referralLink}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('GateNexa — Free GATE Prep')}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      native: null,
    };
    if (platform === 'native' && navigator.share) {
      navigator.share({ title: 'Join GateNexa', text: msg, url: referralLink }).then(() => toast.success('Shared successfully!')).catch(() => toast.error('Share cancelled or failed'));
      return;
    }
    if (urls[platform]) {
      const w = window.open(urls[platform], '_blank', 'noopener,noreferrer');
      if (!w) toast.error('Popup blocked. Copy the link and share manually.');
      else toast.success(`Opening ${platform}...`);
    }
  };

  // Fallback: if no referral link from backend, build one
  useEffect(() => {
    if (!referralLink && referralCode) {
      const base = window.location.origin;
      setReferralLink(`${base}/register?ref=${referralCode}`);
    }
  }, [referralCode, referralLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #050816, #0B1020)' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-4 animate-spin" style={{ border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6' }} />
          <p className="text-sm text-slate-400">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #050816, #0B1020)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.span className="text-4xl" animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}>
              🎁
            </motion.span>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Referral Rewards</h1>
          </div>
          <p className="text-sm text-slate-400">
            Invite friends to unlock <span className="text-purple-400 font-semibold">Premium</span> for free
          </p>
        </motion.div>

        {/* Premium Badge */}
        {isPremium && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-3xl">⭐</span>
            <h2 className="text-lg font-bold text-white mt-1">Premium Member</h2>
            <p className="text-xs text-yellow-300/70 mt-1">Unlocked via referrals</p>
          </motion.div>
        )}

        {/* Progress Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 md:p-8 mb-6"
          style={{ background: 'rgba(18,24,40,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center mb-4">
            <p className="text-sm text-slate-400">
              {referralCount >= TARGET ? (
                <span className="text-green-400 font-semibold">🎉 Premium unlocked!</span>
              ) : (
                <>Invite <strong className="text-white">{TARGET - referralCount} more</strong> friend{TARGET - referralCount !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
          <div className="w-full h-2.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)', boxShadow: '0 0 8px rgba(139,92,246,0.3)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (referralCount / TARGET) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{referralCount} / {TARGET}</span>
            <span>{Math.round((referralCount / TARGET) * 100)}%</span>
          </div>

          {/* Stats mini-row */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-lg font-bold text-white">{referralCount}</div>
              <div className="text-[10px] text-slate-500">Successful</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-lg font-bold text-yellow-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-500">Pending</div>
            </div>
          </div>
        </motion.div>

        {/* Code + Link */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 md:p-8 mb-6"
          style={{ background: 'rgba(18,24,40,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">Referral Code</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-[0.25em] text-purple-300"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {referralCode || 'Generating...'}
                </div>
                <button onClick={() => copyToClipboard(referralCode, 'Code')}
                  disabled={!referralCode}
                  className="shrink-0 px-4 py-3 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-30"
                  style={{ background: copied === 'Code' ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.15)', border: `1px solid ${copied === 'Code' ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.25)'}` }}>
                  {copied === 'Code' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">Referral Link</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl px-4 py-2.5 text-xs text-slate-400 truncate"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {referralLink || 'Generating...'}
                </div>
                <button onClick={() => copyToClipboard(referralLink, 'Link')}
                  disabled={!referralLink}
                  className="shrink-0 px-4 py-3 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-30"
                  style={{ background: copied === 'Link' ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.15)', border: `1px solid ${copied === 'Link' ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.25)'}` }}>
                  {copied === 'Link' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Share */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-3xl p-6 md:p-8 mb-6"
          style={{ background: 'rgba(18,24,40,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Share & Earn</h3>
          <div className="flex flex-wrap gap-2.5">
            {[
              { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
              { key: 'telegram', label: 'Telegram', color: '#0088CC' },
              { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
              { key: 'twitter', label: 'Twitter', color: '#1DA1F2' },
            ].map(s => (
              <motion.button key={s.key} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => shareVia(s.key)}
                disabled={!referralLink}
                className="flex-1 min-w-[80px] text-[11px] font-semibold rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}35`, color: s.color }}>
                <span>{s.key === 'whatsapp' ? '💬' : s.key === 'telegram' ? '✈️' : s.key === 'linkedin' ? '💼' : '🐦'}</span>
                {s.label}
              </motion.button>
            ))}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => copyToClipboard(referralLink, 'Link')} disabled={!referralLink}
              className="flex-1 min-w-[80px] text-[11px] font-semibold rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#C4B5FD' }}>
              🔗 Copy Link
            </motion.button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => shareVia('native')} disabled={!referralLink}
                className="flex-1 min-w-[80px] text-[11px] font-semibold rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#67E8F9' }}>
                📤 Share
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-3xl p-6 md:p-8 mb-6"
          style={{ background: 'rgba(18,24,40,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <button onClick={fetchAll} className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors">↻ Refresh</button>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-2xl mb-2">📨</p>
              <p className="text-sm">No referrals yet. Share to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: h.status === 'successful' ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span>{h.status === 'successful' ? '✅' : '⏳'}</span>
                    <div>
                      <div className="text-sm text-white font-medium">{h.name || 'Friend'}</div>
                      {h.email && <div className="text-[10px] text-slate-500">{h.email}</div>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded ${h.status === 'successful' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                    {h.status === 'successful' ? 'Completed' : 'Pending'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {referredBy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-slate-500 mt-6">
            You were referred by <span className="text-purple-400">{referredBy.name}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
