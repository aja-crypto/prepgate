import { Component } from 'react';
import toast from 'react-hot-toast';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.errorCount > 2) return;
    this.errorCount = (this.errorCount || 0) + 1;
    console.error('========== [ErrorBoundary] Caught Error ==========');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Current route:', window.location.href);
    console.error('Message:', error?.message || error?.toString?.() || '(no message)');
    console.error('Error name:', error?.name);
    console.error('Stack:', error?.stack || '(no stack)');
    console.error('Component Stack:', errorInfo?.componentStack || '(no component stack)');
    console.error('Has user token:', !!localStorage.getItem('accessToken'));
    console.error('Context:', this.props.name || '(unnamed boundary)');
    console.error('==================================================');
    if (process.env.NODE_ENV === 'production') {
      toast.error('Something went wrong. Please refresh the page.');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
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
            <h2 className="text-lg font-bold text-text mb-2">Something went wrong</h2>
            <p className="text-sm text-text3 mb-5 max-w-xs mx-auto leading-relaxed">
              An unexpected error occurred. This is usually temporary.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="text-left mb-4 p-3 rounded-lg text-[11px] text-text2 border" style={{ background: 'var(--color-bg-2)', borderColor: 'var(--color-border)' }}>
                <summary className="cursor-pointer font-medium text-text3">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="btn-primary px-5 py-2.5 min-w-[140px]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
