import { Component } from 'react';
import { safeGet, safeSessionGet, safeSessionSet } from '../../utils/storage';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null, retried: 0 };
  retryTimer = null;

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const msg = error?.message || error?.toString?.() || '';
    console.error('========== [ErrorBoundary] Caught Error ==========');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Current route:', window.location.href);
    console.error('Message:', msg || '(no message)');
    console.error('Error name:', error?.name);
    console.error('Stack:', error?.stack || '(no stack)');
    console.error('Component Stack:', errorInfo?.componentStack || '(no component stack)');
    console.error('Has user token:', safeGet('accessToken') != null);
    console.error('Context:', this.props.name || '(unnamed boundary)');
    console.error('==================================================');

    const isChunkError = /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch dynamically|Unable to preload CSS/i.test(msg);
    if (isChunkError) {
      try {
        const key = 'gatenexa_chunk_reload';
        if (safeSessionGet(key) == null) {
          safeSessionSet(key, String(Date.now()));
          window.location.reload();
          return;
        }
      } catch {}
      return;
    }

  }

  componentWillUnmount() {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
  }

  handleRetry = () => {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || this.state.error?.toString?.() || '';
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text mb-2">Unable to load this page</h2>
            <p className="text-sm text-text3 mb-5 max-w-xs mx-auto leading-relaxed">
              An unexpected error occurred. This is usually temporary.
            </p>
            {errMsg && (
              <p className="text-[11px] text-text3/70 mb-4 break-words bg-bg-2/50 border border-border/50 rounded-lg p-2">
                {errMsg}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={this.handleRetry}
              className="btn-primary px-5 py-2.5 min-w-[140px]"
            >
              Retry
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-5 py-2.5 min-w-[140px] rounded-lg border border-border text-text2 hover:text-text transition-colors"
            >
              Go Home
            </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
