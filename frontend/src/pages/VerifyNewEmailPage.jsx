import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService, getApiErrorMessage } from '../services/api';

export default function VerifyNewEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService.verifyNewEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(getApiErrorMessage(error, 'Email change confirmation failed.'));
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8 text-center">
        {status === 'loading' && <div className="text-text3 text-sm">Confirming your new email...</div>}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-text mb-2">Email Updated</h2>
            <p className="text-sm text-text3 mb-4">{message}</p>
            <Link to="/settings" className="text-primary text-sm">Back to Settings →</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-lg font-semibold text-text mb-2">Email Change Failed</h2>
            <p className="text-sm text-text3 mb-4">{message}</p>
            <Link to="/settings" className="text-primary text-sm">Back to Settings</Link>
          </>
        )}
      </div>
    </div>
  );
}
