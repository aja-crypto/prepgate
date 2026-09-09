// Password reset page — linked from email
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PasswordInput from '../components/common/PasswordInput';
import { authService, getApiErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be 8+ characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await authService.resetPassword(token, password);
      const { accessToken, refreshToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success('Password reset! You are now logged in.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reset failed — link may have expired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-text mb-1">Reset Password</h2>
        <p className="text-sm text-text3 mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-2">New Password</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-2">Confirm Password</label>
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="text-center text-sm text-text3 mt-4">
          <Link to="/login" className="text-primary">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
