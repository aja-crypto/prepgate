// Email verification landing page
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService, getApiErrorMessage } from '../services/api';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService.verifyEmail(token)
      .then((res) => { setStatus('success'); setMessage(res.data.message); })
      .catch((err) => { setStatus('error'); setMessage(getApiErrorMessage(err, 'Verification failed')); });
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8 text-center">
        {status === 'loading' && <div className="text-text3 text-sm">Verifying your email...</div>}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-text mb-2">Email Verified!</h2>
            <p className="text-sm text-text3 mb-4">{message}</p>
            <Link to="/dashboard" className="text-primary text-sm">Go to Dashboard →</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-lg font-semibold text-text mb-2">Verification Failed</h2>
            <p className="text-sm text-text3 mb-4">{message}</p>
            <Link to="/login" className="text-primary text-sm">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
