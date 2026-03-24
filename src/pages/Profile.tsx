import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import BottomNav from '../components/BottomNav';
import { useCartStore } from '../stores/cartStore';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { clearCart } = useCartStore();

  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to log out?');
    if (confirm) {
      clearCart();
      await signOut();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-[100px]">
      <div className="bg-primary pt-12 pb-24 px-6 relative rounded-b-[40px] shadow-sm">
        <h1 className="text-2xl font-syne font-extrabold text-white text-center mb-6">Profile</h1>
        
        <div className="absolute -bottom-16 left-6 right-6">
          <div className="bg-surface rounded-3xl p-6 shadow-elevated flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-primary-light flex items-center justify-center text-3xl font-syne font-bold text-primary overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <button 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-sm border-2 border-white"
                onClick={() => alert('Photo upload functionality coming soon.')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
              </button>
            </div>
            
            <h2 className="text-xl font-syne font-bold text-accent">{profile?.full_name}</h2>
            <p className="text-sm font-sans text-text-secondary mt-1 flex flex-col items-center justify-center">
              <span>{profile?.email}</span>
              {profile?.phone && <span className="font-mono mt-0.5">{profile.phone}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-24 px-6 space-y-4">
        
        {/* Account Menu */}
        <div className="card p-2 space-y-1">
          <button 
            onClick={() => navigate('/address-selection')}
            className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-syne font-bold text-accent text-sm block">My Addresses</span>
              <span className="text-xs text-text-secondary">Manage saved locations</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <button 
            onClick={() => navigate('/bookings')}
            className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-syne font-bold text-accent text-sm block">Order History</span>
              <span className="text-xs text-text-secondary">View past bookings and invoices</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          
          <button 
            onClick={() => navigate('/notifications')}
            className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-syne font-bold text-accent text-sm block">Notifications</span>
              <span className="text-xs text-text-secondary">Check recent updates</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Support Section */}
        <div className="card p-2 space-y-1">
          <a href="https://wa.me/919811797407" target="_blank" rel="noreferrer" className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <div className="flex-1 text-left">
              <span className="font-syne font-bold text-accent text-sm block">WhatsApp Support</span>
              <span className="text-xs text-text-secondary">Chat with our team</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button 
            onClick={handleLogout}
            className="w-full text-error font-syne font-bold py-4 rounded-xl border-2 border-error/5 bg-white hover:bg-error/5 transition-colors"
          >
            LOG OUT
          </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 py-6">Version 1.2.0</p>
      </div>

      <BottomNav />
    </div>
  );
}
