import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuthStore } from '../stores/authStore';
import { useAddressStore } from '../stores/addressStore';

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { selectedAddress } = useAddressStore();
  
  // Real implementation will fetch categories from Supabase, but prompt provided static examples
  const categories = [
    { name: 'Plumbing', price: 299, icon: '🔧', color: 'bg-blue-100' },
    { name: 'Electrical', price: 349, icon: '💡', color: 'bg-yellow-100' },
    { name: 'AC Repair', price: 499, icon: '❄️', color: 'bg-cyan-100' },
    { name: 'Carpentry', price: 399, icon: '🪚', color: 'bg-orange-100' },
    { name: 'Painting', price: 999, icon: '🎨', color: 'bg-purple-100' },
    { name: 'Cleaning', price: 599, icon: '🧹', color: 'bg-emerald-100' },
  ];

  useEffect(() => {
    // If no address selected, force them to AddressSelection
    if (!selectedAddress) {
      navigate('/address-selection');
    }
  }, [selectedAddress, navigate]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name?.split(' ')[0] || 'Friend';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return '☀️'; // Sun during day
    return '🌙'; // Moon during night
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Top Section */}
      <div className="bg-surface px-6 pt-6 pb-4 rounded-b-[2.5rem] shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-syne font-extrabold text-primary">Boys@Work</h1>
          </div>
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 bg-gray-50 rounded-full text-text-primary hover:bg-gray-100 transition-colors active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full outline outline-2 outline-white"></span>
          </button>
        </div>

        <button 
          onClick={() => navigate('/address-selection')}
          className="flex items-center gap-2 text-sm text-text-secondary bg-gray-50 px-3 py-1.5 rounded-full w-max hover:bg-gray-100 transition-colors"
        >
          <span className="text-primary">📍</span>
          <span className="font-medium truncate max-w-[200px]">
            {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : 'Select Location'}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        <h2 className="text-3xl font-syne font-bold text-accent mt-6 pr-4 leading-tight">
          {getTimeBasedGreeting()} {getGreetingIcon()}
        </h2>

        <div className="mt-6 relative">
          <input 
            type="text" 
            placeholder="Search for a service..." 
            className="w-full bg-bg border border-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = (e.target as HTMLInputElement).value;
                if (query.trim()) {
                  navigate(`/services?search=${encodeURIComponent(query.trim())}`);
                } else {
                  navigate('/services');
                }
              }
            }}
          />
          <button 
            onClick={() => {
              const input = document.querySelector('input[placeholder="Search for a service..."]') as HTMLInputElement;
              if (input?.value.trim()) {
                navigate(`/services?search=${encodeURIComponent(input.value.trim())}`);
              } else {
                navigate('/services');
              }
            }}
            className="absolute left-4 top-3.5 text-gray-400 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-accent to-primary rounded-3xl p-6 text-white shadow-elevated relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <h3 className="font-syne font-bold text-2xl mb-2">Book Trusted Experts Today</h3>
            <p className="font-sans text-sm text-gray-200 mb-6 opacity-90">Same-day availability across Delhi NCR</p>
            <button 
              onClick={() => navigate('/services')}
              className="bg-white text-primary font-syne font-bold px-5 py-2.5 rounded-full text-sm hover:shadow-lg transition-all active:scale-95"
            >
              Book Now
            </button>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-4 right-4 text-6xl opacity-20 transform rotate-12">🛠️</div>
        </div>

        {/* Categories Grid */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-syne font-bold text-xl text-accent">What do you need help with?</h3>
            <Link to="/services" className="text-sm font-medium text-primary mb-1">See All</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                onClick={() => navigate(`/services?category=${encodeURIComponent(category.name)}`)}
                className="card cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center justify-center p-5 space-y-3"
              >
                <div className={`w-14 h-14 ${category.color} rounded-full flex items-center justify-center text-2xl mb-1`}>
                  {category.icon}
                </div>
                <div className="text-center">
                  <h4 className="font-syne font-bold text-accent">{category.name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">From <span className="font-mono font-medium">₹{category.price}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h3 className="font-syne font-bold text-xl text-accent mb-4">How It Works</h3>
          <div className="card p-5 space-y-5">
            {[
              { title: 'Choose Your Service', desc: 'Select from our wide range of services', icon: '1️⃣' },
              { title: 'Pick a Time Slot', desc: 'Choose a convenient date and time', icon: '2️⃣' },
              { title: 'Expert Arrives', desc: 'Verified professional at your doorstep', icon: '3️⃣' },
              { title: 'Pay After Satisfaction', desc: 'Secure online payment after work is done', icon: '4️⃣' }
            ].map((step, idx, arr) => (
              <div key={step.title} className="flex gap-4 relative">
                {idx !== arr.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-[-20px] w-0.5 bg-gray-100"></div>
                )}
                <div className="w-6 h-6 shrink-0 relative z-10">{step.icon}</div>
                <div>
                  <h4 className="font-bold text-accent text-sm pb-1">{step.title}</h4>
                  <p className="text-xs text-text-secondary">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
