import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerify from './pages/OtpVerify';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import AddressSelection from './pages/AddressSelection';
import AddAddress from './pages/AddAddress';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BookingSuccess from './pages/BookingSuccess';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import { App as CapacitorApp } from '@capacitor/app';

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
      // Native URLs might look like com.boysatwork.app://localhost/#access_token=...
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
            // Force a refresh to home to ensure session is picked up
            window.location.href = '/home';
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

    return () => {
      subscription.unsubscribe();
      CapacitorApp.removeAllListeners();
    };
  }, [setUser, fetchProfile, setLoading]);

  return (
    <Router>
      <div className="min-h-screen bg-bg text-text-primary">
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
          
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
