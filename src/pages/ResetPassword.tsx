import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we actually have a session (the reset link should provide one)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one from the Login page.');
      }
    };
    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-surface rounded-3xl p-8 shadow-2xl text-text-primary w-full max-w-md">
          <div className="text-5xl mb-4 text-green-500">✅</div>
          <h2 className="text-2xl font-syne font-bold mb-4">Password Updated!</h2>
          <p className="text-gray-600 mb-6">Your password has been changed successfully. Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-syne font-extrabold text-primary mb-2">Houserve</h1>
          <p className="font-sans text-gray-400">Secure Account Recovery</p>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-2xl text-text-primary">
          <h2 className="text-2xl font-syne font-bold mb-6 text-center">Reset Password</h2>
          
          {error && (
            <div className={`bg-error/10 text-error p-3 rounded-lg mb-6 text-sm text-center ${error.includes('expired') ? 'border border-error' : ''}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</p>
              <input
                type="password"
                placeholder="Enter at least 6 characters"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!!error && error.includes('expired')}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</p>
              <input
                type="password"
                placeholder="Repeat your new password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!!error && error.includes('expired')}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || (!!error && error.includes('expired'))}
              className="btn-primary w-full mt-4"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Remembered your password?{' '}
            <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
