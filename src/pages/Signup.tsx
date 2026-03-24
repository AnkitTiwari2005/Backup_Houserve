import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useHookForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'customer'
          }
        }
      });

      if (authError) throw authError;

      // Profile is now handled by the PostgreSQL trigger automatically
      // to avoid 'permission denied' errors during the signup session race
      
      // Automatically sign them in or prompt to check email
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/login" className="text-gray-500 flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Login
          </Link>
          <h1 className="text-3xl font-syne font-bold text-accent">Create Account</h1>
          <p className="text-text-secondary mt-2">Join Houserve today</p>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-card">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className={`input-field ${errors.fullName ? 'border-error ring-1 ring-error' : ''}`}
                {...register('fullName')}
              />
              {errors.fullName && <p className="text-error text-xs mt-1 ml-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Email Address"
                className={`input-field ${errors.email ? 'border-error ring-1 ring-error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-error text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className={`input-field ${errors.password ? 'border-error ring-1 ring-error' : ''}`}
                {...register('password')}
              />
              {errors.password && <p className="text-error text-xs mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                className={`input-field ${errors.confirmPassword ? 'border-error ring-1 ring-error' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-error text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
