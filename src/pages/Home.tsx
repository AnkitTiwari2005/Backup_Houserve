import { useEffect, useRef, useState, useCallback, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { useAuthStore } from '../stores/authStore';
import { useAddressStore } from '../stores/addressStore';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string;
  bg_gradient: string;
  image_url: string | null;
  link_path: string;
}
interface MostBookedService {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

// ── SVG Icon set (replaces all emojis) ───────────────────────────────────────
const ICONS: Record<string, ReactElement> = {
  Plumbing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Electrical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  'AC Repair': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="2" y="3" width="20" height="8" rx="2"/>
      <path d="M7 11v4M12 11v6M17 11v4M5 19l2-2M19 19l-2-2M12 17v2"/>
    </svg>
  ),
  Carpentry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M15 12H3M21 6H3M21 18H3"/>
    </svg>
  ),
  Painting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M2 18.5A2.5 2.5 0 014.5 16H20V4H4.5A2.5 2.5 0 002 6.5v12z"/>
      <path d="M20 12H8M2 18.5V21"/>
    </svg>
  ),
  Cleaning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 21l9-9M12.5 3.5l8 8-2 2-8-8 2-2z"/>
      <path d="M9.5 6.5l8 8"/>
    </svg>
  ),
  'Pest Control': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  'Appliance Repair': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  Spa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22C6 22 2 17 2 12c0-2 1-5 4-7 0 4 2 7 6 8 4-1 6-4 6-8 3 2 4 5 4 7 0 5-4 10-10 10z"/>
    </svg>
  ),
};

// ── Category list ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Plumbing',        price: 299,  bg: 'bg-blue-50',    color: 'text-blue-500'    },
  { name: 'Electrical',      price: 349,  bg: 'bg-yellow-50',  color: 'text-yellow-500'  },
  { name: 'AC Repair',       price: 499,  bg: 'bg-cyan-50',    color: 'text-cyan-500'    },
  { name: 'Carpentry',       price: 399,  bg: 'bg-orange-50',  color: 'text-orange-500'  },
  { name: 'Painting',        price: 999,  bg: 'bg-purple-50',  color: 'text-purple-500'  },
  { name: 'Cleaning',        price: 599,  bg: 'bg-emerald-50', color: 'text-emerald-500' },
  { name: 'Pest Control',    price: 1299, bg: 'bg-red-50',     color: 'text-red-500'     },
  { name: 'Appliance Repair',price: 499,  bg: 'bg-indigo-50',  color: 'text-indigo-500'  },
  { name: 'Spa',             price: 799,  bg: 'bg-pink-50',    color: 'text-pink-500'    },
];

// ── Fallback promos (real service images) ─────────────────────────────────────
const FALLBACK_PROMOS: Promotion[] = [
  {
    id: '1', title: 'Relax & Rejuvenate at Home',
    subtitle: 'Spa for women — Premium doorstep service', cta_text: 'Book Now',
    bg_gradient: 'linear-gradient(135deg,rgba(30,80,40,0.85),rgba(20,50,30,0.9))',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    link_path: '/services?category=Spa',
  },
  {
    id: '2', title: 'AC Service Starting ₹499',
    subtitle: 'Split & Window AC — Same-day slots', cta_text: 'Book Now',
    bg_gradient: 'linear-gradient(135deg,rgba(15,40,90,0.85),rgba(10,25,70,0.9))',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
    link_path: '/services?category=AC Repair',
  },
  {
    id: '3', title: 'Expert Electricians Ready',
    subtitle: 'Wiring, MCB, switchboard repairs', cta_text: 'Book Now',
    bg_gradient: 'linear-gradient(135deg,rgba(120,50,0,0.85),rgba(80,30,0,0.9))',
    image_url: 'https://images.unsplash.com/photo-1621905252507-b35242f8969d?auto=format&fit=crop&q=80&w=800',
    link_path: '/services?category=Electrical',
  },
];

// ── Offers Carousel ───────────────────────────────────────────────────────────
function OffersCarousel({ promos }: { promos: Promotion[] }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = useCallback(() => {
    ivRef.current = setInterval(() => setActive(p => (p + 1) % promos.length), 3800);
  }, [promos.length]);

  useEffect(() => {
    if (promos.length <= 1) return;
    startAuto();
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [promos.length, startAuto]);

  const goTo = (i: number) => {
    setActive(i);
    if (ivRef.current) clearInterval(ivRef.current);
    startAuto();
  };

  if (!promos.length) return null;
  const p = promos[active];

  return (
    <div>
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative h-44">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => navigate(p.link_path)}
          >
            {/* Background: real photo if available, otherwise solid gradient */}
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: p.bg_gradient }} />
            )}
            {/* Bottom-to-top dark scrim so text is always readable over photo */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)' }}
            />

            {/* Text content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              {p.subtitle && (
                <p className="text-white/70 text-xs uppercase tracking-widest mb-1 font-medium">{p.subtitle}</p>
              )}
              <h3 className="font-syne font-bold text-white text-xl leading-tight mb-3">{p.title}</h3>
              <button
                className="self-start bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                onClick={e => { e.stopPropagation(); navigate(p.link_path); }}
              >
                {p.cta_text}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {promos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {promos.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${i === active ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Most Booked Card ──────────────────────────────────────────────────────────
function BookedCard({ s, onClick }: { s: MostBookedService; onClick: () => void }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
      className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden cursor-pointer">
      {s.image_url
        ? <img src={s.image_url} alt={s.name} className="w-full h-24 object-cover" loading="lazy" />
        : <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
      }
      <div className="p-2.5">
        <p className="font-syne font-bold text-accent text-[11px] leading-tight line-clamp-2 mb-1">{s.name}</p>
        <p className="text-primary font-bold text-xs">₹{s.price}</p>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { selectedAddress } = useAddressStore();

  const [promos, setPromos] = useState<Promotion[]>(FALLBACK_PROMOS);
  const [mostBooked, setMostBooked] = useState<MostBookedService[]>([]);
  const [loadingBooked, setLoadingBooked] = useState(true);

  useEffect(() => {
    if (!selectedAddress) navigate('/address-selection');
  }, [selectedAddress, navigate]);

  // Fetch promotions
  useEffect(() => {
    supabase.from('promotions')
      .select('id, title, subtitle, cta_text, bg_gradient, image_url, link_path')
      .eq('is_active', true).order('sort_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setPromos(data as Promotion[]);
      });
  }, []);

  // Fetch most booked via booking_items
  useEffect(() => {
    const fetch = async () => {
      setLoadingBooked(true);
      try {
        const { data, error } = await supabase
          .from('booking_items')
          .select('service_id, services(id, name, price, image_url)')
          .limit(200);

        if (!error && data && data.length > 0) {
          const map: Record<string, { s: MostBookedService; n: number }> = {};
          for (const row of data as any[]) {
            const svc = row.services;
            if (!svc) continue;
            if (!map[svc.id]) map[svc.id] = { s: svc, n: 0 };
            map[svc.id].n++;
          }
          const sorted = Object.values(map).sort((a, b) => b.n - a.n).slice(0, 8).map(e => e.s);
          if (sorted.length > 0) { setMostBooked(sorted); return; }
        }
        // Fallback: top services by sort_order
        const { data: fb } = await supabase.from('services')
          .select('id, name, price, image_url').eq('is_active', true)
          .order('sort_order').limit(8);
        if (fb) setMostBooked(fb as MostBookedService[]);
      } finally {
        setLoadingBooked(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-safe-nav">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="bg-surface px-4 pt-3 pb-3 sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {/* Row 1: Logo + Notification + Profile */}
        <div className="flex justify-between items-center mb-2.5">
          <img
            src="/home-logo.png"
            alt="Houserve"
            className="h-8 w-auto object-contain"
            onError={e => {
              const t = e.currentTarget;
              t.style.display = 'none';
              const fb = document.createElement('span');
              fb.className = 'text-xl font-syne font-extrabold text-primary';
              fb.textContent = 'Houserve';
              t.parentNode?.insertBefore(fb, t);
            }}
          />
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/notifications')}
              className="relative p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors active:scale-95">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-error rounded-full outline outline-2 outline-white"/>
            </button>
            <button onClick={() => navigate('/profile')}
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-syne font-bold active:scale-95">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </button>
          </div>
        </div>

        {/* Row 2: Address chip */}
        <button onClick={() => navigate('/address-selection')}
          className="flex items-center gap-1.5 text-xs text-text-secondary bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors w-max max-w-full mb-2.5">
          <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="font-medium truncate">
            {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : 'Select Location'}
          </span>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {/* Row 3: Search */}
        <div className="relative">
          <input type="text" placeholder="Search for a service..."
            className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value.trim();
                navigate(q ? `/services?search=${encodeURIComponent(q)}` : '/services');
              }
            }}
          />
          <svg className="absolute left-3.5 top-[11px] w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-6">

        {/* Offers Carousel */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-syne font-bold text-base text-accent">Offers &amp; Discounts</h2>
          </div>
          <OffersCarousel promos={promos} />
        </section>

        {/* Categories 3-col */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-syne font-bold text-base text-accent">What do you need?</h2>
            <Link to="/services" className="text-xs font-semibold text-primary">See All</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <motion.div key={cat.name} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/services?category=${encodeURIComponent(cat.name)}`)}
                className="bg-white rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.06)] active:shadow-sm transition-shadow">
                <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center mb-1.5`}>
                  {ICONS[cat.name] ?? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                  )}
                </div>
                <p className="font-syne font-bold text-accent text-[11px] leading-tight mb-0.5">{cat.name}</p>
                <p className={`text-[10px] font-semibold ${cat.color}`}>From ₹{cat.price}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Most Booked */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-syne font-bold text-base text-accent">Most Booked</h2>
            <Link to="/services" className="text-xs font-semibold text-primary">See All</Link>
          </div>
          {loadingBooked ? (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {[1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-36 h-40 rounded-2xl bg-gray-100 animate-pulse"/>)}
            </div>
          ) : mostBooked.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {mostBooked.map(s => (
                <BookedCard key={s.id} s={s} onClick={() => navigate(`/services/${s.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-sm text-center py-4">No services found</p>
          )}
        </section>

        {/* How It Works */}
        <section className="pb-2">
          <h2 className="font-syne font-bold text-base text-accent mb-3">How It Works</h2>
          <div className="card p-5 space-y-4">
            {[
              { title: 'Choose a Service', desc: 'Pick from our professional services', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              )},
              { title: 'Pick a Time Slot', desc: 'Choose a convenient date & time', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} strokeLinecap="round"/></svg>
              )},
              { title: 'Expert Arrives', desc: 'Verified pro at your doorstep', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              )},
              { title: 'Pay After Satisfaction', desc: 'Secure payment after job done', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              )},
            ].map((step, idx, arr) => (
              <div key={step.title} className="flex gap-3 relative">
                {idx !== arr.length - 1 && <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-gray-100"/>}
                <div className="w-8 h-8 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center relative z-10">
                  {step.icon}
                </div>
                <div className="pt-0.5">
                  <p className="font-bold text-accent text-sm">{step.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
