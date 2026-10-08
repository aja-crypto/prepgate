// Shared, user-friendly Google sign-in failure state.
// Never renders raw axios text such as "Request failed with status code 401".
// The real HTTP status / message stays available in the developer console.
import { RefreshCw, Mail } from 'lucide-react';

/** Log the real failure for developers without ever surfacing it to users. */
export function reportGoogleAuthError(err, stage = 'google-auth') {
  const status = err?.response?.status ?? err?.code ?? 'unknown';
  const message = err?.response?.data?.message || err?.message || 'unknown';
  // eslint-disable-next-line no-console
  console.error(`[GoogleAuth] stage=${stage} status=${status} message=${message}`);
}

export default function GoogleAuthError({ onRetry, onUseEmail, className = '' }) {
  return (
    <div
      role="alert"
      className={`rounded-xl px-4 py-3.5 ${className}`}
      style={{
        background: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.16)',
      }}
    >
      <p className="text-[13px] font-semibold text-red-300/95 mb-1">Google sign-in failed</p>
      <p className="text-xs leading-relaxed text-white/55 mb-3">
        We couldn&rsquo;t complete Google sign-in. Please try again or continue with email and
        password.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-200 rounded-lg px-3 py-2 transition-colors"
          style={{ background: 'rgba(124, 58, 237, 0.16)', border: '1px solid rgba(124, 58, 237, 0.32)' }}
        >
          <RefreshCw size={13} />
          Try again
        </button>
        <button
          type="button"
          onClick={onUseEmail}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white/85 rounded-lg px-3 py-2 transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Mail size={13} />
          Use email instead
        </button>
      </div>
    </div>
  );
}
