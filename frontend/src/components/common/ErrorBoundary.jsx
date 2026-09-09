import { Component } from 'react';

export class RouteErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('[RouteError]', error); }
  componentDidUpdate(prevProps) { if (this.state.hasError && prevProps.children !== this.props.children) this.setState({ hasError: false }); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-sm font-semibold text-text mb-2">Unable to load this page.</p>
          <p className="text-xs text-text3 mb-4">A network issue or update may have interrupted loading.</p>
          <div className="flex gap-2 justify-center">
            <button type="button" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="btn-primary text-xs px-4 py-2 rounded-lg">Retry</button>
            <button type="button" onClick={() => window.location.href = '/dashboard'} className="btn-ghost text-xs px-4 py-2">Go to Dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
