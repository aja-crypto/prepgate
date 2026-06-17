import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">Settings</h1>
        <p className="text-sm text-text3 mt-0.5">Admin panel configuration</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-text3 mb-1">Name</div>
            <div className="text-sm text-text">{admin?.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-text3 mb-1">Email</div>
            <div className="text-sm text-text">{admin?.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-text3 mb-1">Role</div>
            <div className="text-sm text-text capitalize">{admin?.role?.replace('_', ' ') || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-text3 mb-1">Permissions</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(admin?.permissions || []).map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
        Advanced settings (email config, site maintenance, branding) coming soon.
      </div>
    </div>
  );
}