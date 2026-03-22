import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for performance (Audit Issue #8)
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OtpVerify = lazy(() => import('./pages/OtpVerify'));
const Splash = lazy(() => import('./pages/Splash'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AddressSelection = lazy(() => import('./pages/AddressSelection'));
const AddAddress = lazy(() => import('./pages/AddAddress'));
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

import { App as CapacitorApp } from '@capacitor/app';

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const { setUser, fetchProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Handle deep links for OAuth
    CapacitorApp.addListener('appUrlOpen', async (data: { url: string }) => {
      const url = data.url;
      const fragment = url.split('#')[1];
      
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            // AUTHORITATIVE ROUTING (Audit Fix #2.5)
            const path = url.split('://')[1]?.split('?')[0]?.split('#')[0] || '';
            if (path.includes('reset-password')) {
               window.location.href = '/reset-password';
            } else if (path.includes('verify-email')) {
               window.location.href = '/verify-email';
            } else {
               window.location.href = '/home';
            }
          }
        }
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Initialize Push Notifications (Audit Fix #2.9)
    import('./lib/notifications').then(({ initializeNotifications }) => {
      initializeNotifications();
    });

    return () => {
      subscription.unsubscribe();
      CapacitorApp.removeAllListeners();
    };
  }, [setUser, fetchProfile, setLoading]);

  return (
    <Router>
      <div className="min-h-screen bg-bg text-text-primary">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/splash" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/otp-verify" element={<OtpVerify />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/address-selection" element={<AddressSelection />} />
              <Route path="/add-address" element={<AddAddress />} />
              <Route path="/home" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
            </Route>
            
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Navigate to="/splash" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
