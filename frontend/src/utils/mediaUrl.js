const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch { return url; }
  }
  const relative = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${relative}`;
}
