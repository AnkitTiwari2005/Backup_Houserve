import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, Suspense, lazy, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from './stores/authStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

// Lazy load pages
const Login        = lazy(() => import('./pages/Login'));
const Signup       = lazy(() => import('./pages/Signup'));
const OtpVerify    = lazy(() => import('./pages/OtpVerify'));
const Onboarding   = lazy(() => import('./pages/Onboarding'));
const AddressSelection = lazy(() => import('./pages/AddressSelection'));
const AddAddress   = lazy(() => import('./pages/AddAddress'));
const Home         = lazy(() => import('./pages/Home'));
const Services     = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Cart         = lazy(() => import('./pages/Cart'));
const Checkout     = lazy(() => import('./pages/Checkout'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const Bookings     = lazy(() => import('./pages/Bookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile      = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail  = lazy(() => import('./pages/VerifyEmail'));

const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';

// ── Splash Overlay (always renders on every launch, on top of everything) ────
function SplashOverlay({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [isFirst, setIsFirst] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  const finish = useCallback((first: boolean) => {
    if (first) {
      navigate('/onboarding', { replace: true });
      setTimeout(onDone, 300);
    } else {
      onDone();
    }
  }, [navigate, onDone]);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    let mounted = true;

    (async () => {
      const { value } = await Preferences.get({ key: FIRST_LAUNCH_KEY });
      const first = value === null;
      if (!mounted) return;
      setIsFirst(first);

      if (first) {
        await Preferences.set({ key: FIRST_LAUNCH_KEY, value: 'true' });
        setTimeout(() => { if (mounted) finish(true); }, 2400);
      } else {
        iv = setInterval(() => setProgress(p => Math.min(p + 5, 100)), 80);
        setTimeout(() => { if (mounted) { clearInterval(iv); finish(false); } }, 1600);
      }
    })();

    return () => { mounted = false; clearInterval(iv); };
  }, [finish]);

  // While checking (< 50ms), show dark screen to avoid flash
  const showFirst = isFirst === true;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: showFirst ? '#F3732A' : '#1A1A2E' }}
    >
      {/* Glow blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: showFirst ? 'rgba(255,255,255,0.15)' : 'rgba(243,115,42,0.2)' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: showFirst ? 'rgba(26,26,46,0.3)' : 'rgba(243,115,42,0.1)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
        className="flex flex-col items-center z-10"
      >
        {/* Soft orange glow ring behind the logo */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F3732A 0%, transparent 70%)' }}
        />

        {/* Logo — large, no box, floats on glow */}
        <img
          src="/splash-logo.png"
          alt="Houserve"
          className="w-40 h-40 object-contain relative z-10 mb-7 drop-shadow-2xl rounded-[2rem] overflow-hidden"
        />

        <h1 className="text-4xl font-syne font-black text-white tracking-tight mb-1 z-10">
          Houserve
        </h1>
        <p className="text-white/40 text-xs tracking-widest uppercase mb-10 z-10">
          Home &amp; Facility Services
        </p>


        {/* First launch: bouncing dots | Returning: progress bar */}
        {showFirst ? (
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: ['0%', '-70%', '0%'] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                className="w-2.5 h-2.5 bg-white rounded-full"
              />
            ))}
          </div>
        ) : (
          <div className="w-44 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#F3732A' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear', duration: 0.08 }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Page loader ───────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const { setUser, fetchProfile, setLoading } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;

    const extractTokens = (url: string) => {
      const fragment = url.split('#')[1] || url.split('?')[1] || '';
      if (!fragment) return null;
      const p = new URLSearchParams(fragment);
      const a = p.get('access_token'), r = p.get('refresh_token');
      return (a && r) ? { accessToken: a, refreshToken: r } : null;
    };

    const initAuth = async () => {
      const launchUrl = await CapacitorApp.getLaunchUrl();
      if (launchUrl?.url) {
        const t = extractTokens(launchUrl.url);
        if (t) await supabase.auth.setSession({ access_token: t.accessToken, refresh_token: t.refreshToken });
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } catch (err) {
        console.error('Auth Init Failure', err);
      } finally {
        if (mounted) { setLoading(false); SplashScreen.hide().catch(() => {}); }
      }
    };

    initAuth();

    const handleAppUrlOpen = async (data: { url: string }) => {
      if (data.url.includes('reset-password')) window.location.hash = '/reset-password';
      const t = extractTokens(data.url);
      if (t && mounted) {
        setLoading(true);
        const { error } = await supabase.auth.setSession({ access_token: t.accessToken, refresh_token: t.refreshToken });
        if (error) setLoading(false);
      }
    };

    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); CapacitorApp.removeAllListeners(); };
  }, [setUser, fetchProfile, setLoading]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-2 border-primary-light">
          <h2 className="text-2xl font-syne font-bold text-accent mb-4">Config Required</h2>
          <p className="text-text-secondary mb-6 font-medium leading-relaxed">
            Missing <code>VITE_SUPABASE_URL</code> or <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Standalone — no auth guard (onboarding must be accessible pre-login) */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public — redirects logged-in users away */}
          <Route element={<PublicRoute />}>
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/otp-verify" element={<OtpVerify />} />
          </Route>

          {/* Protected — requires login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home"             element={<Home />} />
            <Route path="/address-selection" element={<AddressSelection />} />
            <Route path="/add-address"       element={<AddAddress />} />
            <Route path="/services"          element={<Services />} />
            <Route path="/services/:id"      element={<ServiceDetail />} />
            <Route path="/cart"              element={<Cart />} />
            <Route path="/checkout"          element={<Checkout />} />
            <Route path="/booking-success"   element={<BookingSuccess />} />
            <Route path="/bookings"          element={<Bookings />} />
            <Route path="/bookings/:id"      element={<BookingDetail />} />
            <Route path="/notifications"     element={<Notifications />} />
            <Route path="/profile"           element={<Profile />} />
            <Route path="/"                  element={<Navigate to="/home" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Splash overlay — always shown on every cold launch, regardless of auth state */}
      <AnimatePresence>
        {!splashDone && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999]"
          >
            <SplashOverlay onDone={() => setSplashDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>
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
