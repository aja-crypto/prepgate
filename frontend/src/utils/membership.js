export function getMembershipStatus(user) {
  const isPremium = user?.isPremium === true;
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  if (isOwner) {
    return { label: 'OWNER', isPremium: true, isOwner: true, isAdmin: false, badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  }
  if (isAdmin) {
    return { label: 'ADMIN', isPremium: true, isOwner: false, isAdmin: true, badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  }
  if (isPremium) {
    return { label: 'PREMIUM', isPremium: true, isOwner: false, isAdmin: false, badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  }
  return { label: 'BASIC', isPremium: false, isOwner: false, isAdmin: false, badgeClass: 'bg-white/5 text-slate-500 border-white/10' };
}

export function formatPackageLPA(value) {
  if (value == null || isNaN(Number(value))) return '—';
  const num = Number(value);
  if (num >= 100) return `₹${Math.round(num / 100)} LPA`;
  if (num >= 1) return `₹${num.toFixed(1)} LPA`;
  return `₹${num} LPA`;
}

export function formatCurrencyCompact(value) {
  if (value == null || isNaN(Number(value))) return '—';
  const num = Number(value);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}
