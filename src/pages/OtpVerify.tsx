import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OtpVerify() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [phone, navigate]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit on last digit
    if (index === 5 && value && newOtp.every(v => v !== '')) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move back on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpString: string) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otpString,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // Check if user has a profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          // New user logic - normally we'd redirect to a name collection screen
          // For now, we'll create a basic profile and redirect to home
          await supabase.from('profiles').insert({
            id: data.user.id,
            phone: phone,
          });
        }
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length === 6) {
      verifyOtp(otpString);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/login" className="text-gray-500 flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </Link>
          <h1 className="text-3xl font-syne font-bold text-accent">Verify Phone</h1>
          <p className="text-text-secondary mt-2">
            Code sent to <span className="font-mono text-text-primary font-medium">{phone}</span>
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-card">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-mono font-bold border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={async () => {
                  setLoading(true);
                  setError('');
                  try {
                    const { error: resendError } = await supabase.auth.signInWithOtp({ phone });
                    if (resendError) throw resendError;
                    alert('OTP Resent successfully!');
                  } catch (err: any) {
                    setError(err.message || 'Failed to resend OTP');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
              >
                {loading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
