import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but has no profile yet (e.g., just signed up via OTP/Google), they need to complete signup
  // We'll handle this routing later. For now, just allow them through.
  
  return <Outlet />;
};

export const PublicRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already logged in, redirect away from public pages like login/signup
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
