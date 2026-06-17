export default function AdminNotificationsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">Notifications</h1>
        <p className="text-sm text-text3 mt-0.5">Manage push notifications and system alerts</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-text mb-2">Notification Center</h2>
        <p className="text-sm text-text3 max-w-sm mx-auto leading-relaxed">
          Create and send push notifications to users, schedule announcements, and view delivery analytics.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs text-text3">Available with MongoDB connection</span>
        </div>
      </div>
    </div>
  );
}