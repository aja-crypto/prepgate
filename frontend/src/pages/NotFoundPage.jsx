import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-primary/10 border border-primary/20">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-5xl font-bold text-text mb-2">404</h1>
        <p className="text-lg text-text2 mb-2">Page not found</p>
        <p className="text-sm text-text3 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary text-sm">Go Home</Link>
          <Link to="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
