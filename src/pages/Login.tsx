import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';


export default function Login() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const phoneNumber = phone.startsWith('+91') ? phone : `+91${phone}`;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      
      if (error) throw error;
      navigate('/otp-verify', { state: { phone: phoneNumber } });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // In Capacitor, we use a custom scheme to redirect back to the app
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.boysatwork.app://localhost'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-syne font-extrabold text-primary mb-2">Boys@Work</h1>
          <p className="font-sans text-gray-400">Delhi NCR's Most Trusted Home Services</p>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-2xl text-text-primary">
          <h2 className="text-2xl font-syne font-bold mb-6 text-center">Welcome Back</h2>
          
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {/* Method Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-full mb-6">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-syne font-bold transition-all ${method === 'email' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => { setMethod('email'); setError(''); }}
            >
              Email
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-syne font-bold transition-all ${method === 'phone' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => { setMethod('phone'); setError(''); }}
            >
              Phone
            </button>
          </div>

          {method === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!email) {
                      setError('Please enter your email to reset password');
                      return;
                    }
                    setLoading(true);
                    setError('');
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) throw error;
                      alert('Password reset link sent to your email!');
                    } catch (err: any) {
                      setError(err.message || 'Failed to send reset link');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="text-sm text-primary font-bold hover:text-primary-dark transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-3 text-gray-500 font-mono font-semibold">+91</div>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  className="input-field pl-12"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-gray-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
