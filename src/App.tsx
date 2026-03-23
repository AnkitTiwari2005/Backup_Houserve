import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

// Lazy load pages for performance
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

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function MainApp() {
  const { setUser, fetchProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // 1. Robust Token Extractor for Deep Links
    const extractTokensFromUrl = (url: string) => {
      // Handles both hash and search params for flexibility
      const fragment = url.split('#')[1] || url.split('?')[1] || '';
      if (!fragment) return null;
      
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      return (accessToken && refreshToken) ? { accessToken, refreshToken } : null;
    };

    // 2. Auth Initialization (Cold Start & Session Check)
    const initAuth = async () => {
       // A. Check if opened via deep link (Cold Start)
       const launchUrl = await CapacitorApp.getLaunchUrl();
       if (launchUrl?.url) {
         const tokens = extractTokensFromUrl(launchUrl.url);
         if (tokens) {
           await supabase.auth.setSession({
             access_token: tokens.accessToken,
             refresh_token: tokens.refreshToken
           });
         }
       }

       // B. Standard session check
       try {
         const { data: { session } } = await supabase.auth.getSession();
         if (!mounted) return;
         
         setUser(session?.user ?? null);
         if (session?.user) {
           await fetchProfile(session.user.id);
         }
       } catch (err) {
         console.error("Auth Init Failure", err);
       } finally {
         if (mounted) {
           setLoading(false);
           SplashScreen.hide().catch(() => {});
         }
       }
    };

    initAuth();

    // 3. Listen for Deep Links while app is open
    const handleAppUrlOpen = async (data: { url: string }) => {
      const tokens = extractTokensFromUrl(data.url);
      if (tokens && mounted) {
        setLoading(true);
        const { error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken
        });
        if (!error) {
          // Success will be caught by onAuthStateChange listener
        } else {
          setLoading(false);
        }
      }
    };

    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    // 4. Listen for Auth State Changes (Main Source of Truth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      CapacitorApp.removeAllListeners();
    };
  }, [setUser, fetchProfile, setLoading]);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/splash" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/otp-verify" element={<OtpVerify />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/address-selection" element={<AddressSelection />} />
            <Route path="/add-address" element={<AddAddress />} />
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
  );
}

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;
