// GATE news and announcements feed
import { formatDistanceToNow, isAfter, subHours } from 'date-fns';
import Icon from '../ui/Icon';

export default function LiveNewsFeed({ announcements = [], rssFeed = [], lastUpdated, onRefresh, loading }) {
  const items = [
    ...announcements.map((a) => ({ ...a, kind: a.type === 'syllabus_update' ? 'Syllabus' : 'GATE' })),
    ...rssFeed.map((r) => ({ ...r, kind: 'RSS' })),
  ].slice(0, 10);

  const isNew = (date) => {
    if (!date) return false;
    return isAfter(new Date(date), subHours(new Date(), 24));
  };

  if (!items.length && !loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-text">📢 Latest GATE News</div>
          <button onClick={onRefresh} className="p-1 hover:bg-bg-3 rounded-lg transition-colors">
            <Icon name="refresh" className="w-3.5 h-3.5 text-text3" />
          </button>
        </div>
        <p className="text-xs text-text3">No announcements yet. Data refreshes every few hours.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">📢 Latest GATE News</div>
          <div className="text-[11px] text-text3 mt-0.5">
            Official updates & RSS feed
            {lastUpdated && <span className="ml-1 opacity-60">· {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          <button 
            onClick={onRefresh} 
            disabled={loading}
            className="p-1.5 hover:bg-bg-3 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh News"
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 text-text3 ${loading ? 'animate-pulse' : ''}`} />
          </button>
          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Live</span>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item, i) => (
          <a
            key={`news-item-${item.kind}-${i}-${item._id || 'no-id'}`}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-bg-2 border border-border rounded-lg p-3 hover:border-primary/30 transition-all hover:translate-x-0.5 relative overflow-hidden group"
          >
            {isNew(item.publishedAt) && (
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-[8px] font-bold text-white px-2 py-0.5 rounded-bl-lg">NEW</div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 mt-0.5 font-bold uppercase tracking-wider">{item.kind}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text font-medium truncate group-hover:text-primary transition-colors">{item.title}</div>
                {item.summary && <div className="text-[11px] text-text3 mt-1 line-clamp-2 leading-relaxed">{item.summary}</div>}
                <div className="text-[10px] text-text3 mt-1.5 flex items-center gap-1.5">
                  <span className="font-medium text-text2">{item.source}</span>
                  <span>·</span>
                  <span>{item.publishedAt && formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
