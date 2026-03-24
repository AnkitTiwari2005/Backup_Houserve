import { Link } from 'react-router-dom';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-primary-light/20">
      <div className="w-full max-w-md text-center">
        <div className="bg-surface rounded-3xl p-8 shadow-card border border-primary/10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-syne font-bold text-accent mb-4">Verify Your Email</h1>
          <p className="text-text-secondary leading-relaxed mb-8">
            We've sent a verification link to your email address. Please click the link in the email to activate your account.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-4 text-base"
            >
              I've Verified My Email
            </button>
            <Link 
              to="/login" 
              className="block text-sm font-bold text-primary hover:text-primary-dark transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-xs text-text-secondary mt-8 px-6">
          Didn't receive the email? Check your spam folder or contact support if the issue persists.
        </p>
      </div>
    </div>
  );
}
