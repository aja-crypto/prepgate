// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg">🎓</div>
          <div><h1 className="font-bold text-lg text-text leading-none">GATE 2027</h1></div>
        </div>
        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-text mb-2">Check your email</h2>
              <p className="text-sm text-text3">We've sent a password reset link to <span className="text-text">{email}</span></p>
              <Link to="/login" className="block mt-6 text-primary text-sm font-medium hover:opacity-80">← Back to login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-text mb-1">Reset password</h2>
              <p className="text-sm text-text3 mb-6">Enter your email and we'll send a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full bg-bg-2 border border-white/8 rounded-lg px-4 py-3 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60 transition-colors" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-3 font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-text3 mt-6">
                <Link to="/login" className="text-primary font-medium hover:opacity-80">← Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
