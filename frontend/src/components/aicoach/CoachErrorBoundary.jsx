import { Component } from 'react';

export default class CoachErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[CoachBoundary] ${this.props.name || 'Section'} failed:`, error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 24, borderRadius: 16, textAlign: 'center',
          background: 'rgba(18,23,36,0.7)', border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
            {this.props.name || 'This section'} is temporarily unavailable.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
