import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import BottomNav from '../components/BottomNav';

export default function Bookings() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchBookings();

      // Realtime subscription
      const subscription = supabase
        .channel('public:bookings')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'bookings',
            filter: `customer_id=eq.${profile.id}`
          }, 
          (payload) => {
            console.log('Booking changed:', payload);
            fetchBookings(); // Refetch to get joined service data easily
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [profile]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( name, image_url ),
          booking_items (
            services ( name )
          )
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeStatuses = ['pending_payment', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'in_progress'];
  
  const filteredBookings = bookings.filter(b => 
    activeTab === 'active' 
      ? activeStatuses.includes(b.status)
      : !activeStatuses.includes(b.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Confirmed</span>;
      case 'assigned': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Assigned</span>;
      case 'accepted': return <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs font-bold">Accepted</span>;
      case 'on_the_way': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold animate-pulse">On the Way 🚗</span>;
      case 'in_progress': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">In Progress 🔧</span>;
      case 'completed': return <span className="bg-success text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">Completed ✅</span>;
      case 'cancelled': return <span className="bg-error/10 text-error px-2 py-1 rounded-full text-xs font-bold">Cancelled</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-[100px]">
      <div className="bg-surface px-6 pt-6 pb-2 shadow-sm sticky top-0 z-10 border-b border-border">
        <h1 className="text-2xl font-syne font-bold text-accent mb-4">My Bookings</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-2 font-syne font-bold text-sm transition-all border-b-2 ${
              activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Orders
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-2 font-syne font-bold text-sm transition-all border-b-2 ${
              activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Orders
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="card p-0 overflow-hidden cursor-pointer hover:shadow-elevated transition-shadow"
              onClick={() => navigate(`/bookings/${booking.id}`)}
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="font-mono text-text-secondary text-sm font-bold">{booking.booking_ref}</span>
                {getStatusBadge(booking.status)}
              </div>
              <div className="p-4 flex gap-4">
                <div className="w-16 h-16 bg-primary-light rounded-xl overflow-hidden shrink-0">
                  {booking.services?.image_url ? (
                    <img src={booking.services.image_url} alt="Service" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛠️</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-syne font-bold text-accent mb-1">
                    {booking.booking_items && booking.booking_items.length > 0 
                      ? (
                        <>
                          {booking.booking_items[0].services?.name}
                          {booking.booking_items.length > 1 && (
                            <span className="text-primary ml-1.5">
                              + {booking.booking_items.length - 1} {booking.booking_items.length - 1 === 1 ? 'other' : 'others'}
                            </span>
                          )}
                        </>
                      )
                      : (booking.services?.name || 'Service')
                    }
                  </h3>
                  <div className="text-sm text-text-secondary space-y-1 font-medium">
                    <p className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(booking.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {booking.scheduled_time.substring(0,5)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0 flex justify-between items-center">
                <span className="font-mono font-bold text-primary">₹{booking.total_amount}</span>
                <button className="text-sm font-syne font-bold text-primary px-4 py-1.5 bg-primary-light rounded-full">
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
              📋
            </div>
            <h3 className="text-lg font-syne font-bold text-accent mb-2">
              No {activeTab} orders found
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === 'active' 
                ? "You don't have any ongoing bookings at the moment." 
                : "Your past booking history will appear here."}
            </p>
            {activeTab === 'active' && (
              <button 
                onClick={() => navigate('/services')}
                className="btn-primary"
              >
                Book a Service
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
