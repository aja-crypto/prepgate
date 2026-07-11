import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-5xl font-bold text-text mb-2">500</h1>
        <p className="text-lg text-text2 mb-2">Something went wrong</p>
        <p className="text-sm text-text3 mb-8">Our team has been notified. Please try again in a moment.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary text-sm">Go Home</Link>
          <Link to="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
