import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #050816 0%, #0B1020 50%, #050816 100%)' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8"><path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" /><path d="M4 10l12 6m0 0l12-6m-12 6v12" stroke="white" strokeWidth="2" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-white/50 mt-1">GateNexa Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ 
          background: 'rgba(18, 24, 40, 0.7)', 
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gatenexa.dev"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
