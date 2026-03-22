import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    fetchBooking(id);

    const subscription = supabase
      .channel(`booking-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` }, 
        (payload) => {
          console.log('Booking detail changed:', payload);
          fetchBooking(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const fetchBooking = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services ( name, image_url, category ),
          booking_items (
            id,
            quantity,
            total_price,
            services ( name, image_url )
          )
        `)
        .eq('id', bookingId)
        .single();
        
      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state to reflect cancellation immediately
      setBooking({ ...booking, status: 'cancelled' });
    } catch (err) {
      alert('Failed to cancel booking. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-syne font-bold text-accent mb-2">Booking Not Found</h2>
        <button onClick={() => navigate('/bookings')} className="btn-primary mt-4">Back to Bookings</button>
      </div>
    );
  }

  // Stepper logic
  const steps = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'on_the_way', label: 'On Way' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isActive = ['confirmed', 'assigned'].includes(booking.status);

  return (
    <div className="min-h-screen bg-bg pb-[100px]">
      <div className="bg-surface p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 border border-transparent">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-syne font-bold text-accent">Booking Details</h1>
        </div>
        <span className="font-mono text-primary font-bold bg-primary-light px-3 py-1.5 rounded-lg text-sm">
          {booking.booking_ref}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Stepper */}
        {!isCancelled ? (
          <div className="card py-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-[500px] px-2 relative">
              <div className="absolute left-6 right-6 top-3 h-1 bg-gray-100 -z-10 rounded-full"></div>
              
              {/* Progress Line Filler */}
              {currentStepIndex >= 0 && (
                <div 
                  className="absolute left-6 top-3 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 48px)' }}
                ></div>
              )}

              {steps.map((step, index) => {
                const isCompleted = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-colors duration-300 ${isCompleted ? 'bg-primary text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${isCurrent ? 'text-primary' : isCompleted ? 'text-accent' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card bg-error/10 border-error/20 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-error mb-3 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="font-syne font-bold text-error text-lg mb-1">Booking Cancelled</h3>
            <p className="text-sm text-text-secondary">This booking has been cancelled.</p>
          </div>
        )}

        {/* Status Info (Replacing Technician Card) */}
        {!isCancelled && (
          <div className="card flex items-center gap-4 border-l-4 border-primary">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-2xl shadow-sm">
              {['confirmed', 'assigned'].includes(booking.status) ? '🔍' : '🏠'}
            </div>
            <div>
              <p className="font-syne font-bold text-base text-accent">
                {['confirmed', 'assigned'].includes(booking.status) ? 'Searching for Professional' : 'Professional Assigned'}
              </p>
              <p className="text-xs text-text-secondary font-medium">
                {['confirmed', 'assigned'].includes(booking.status) 
                  ? 'We are assigning the best expert for your service.' 
                  : 'Your service will be completed as scheduled.'}
              </p>
            </div>
          </div>
        )}

        {/* Service Info (Multi-item support - Audit Fix #2.7) */}
        <div className="card">
          <h3 className="font-syne font-bold text-accent mb-3 text-sm uppercase tracking-wider text-text-secondary">Service Details</h3>
          <div className="space-y-4">
            {(booking.booking_items && booking.booking_items.length > 0) ? (
              booking.booking_items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.services?.image_url ? (
                        <img src={item.services.image_url} alt="Service" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl bg-primary-light">🛠️</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-syne font-bold text-accent leading-tight">{item.services?.name}</h4>
                      <p className="text-xs text-text-secondary mt-1">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-gray-700 text-sm">₹{item.total_price}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {booking.services?.image_url ? (
                      <img src={booking.services.image_url} alt="Service" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl bg-primary-light">🛠️</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-accent leading-tight">{booking.services?.name}</h4>
                    <p className="text-xs text-text-secondary mt-1">Category: {booking.services?.category}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Address */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Schedule</h3>
            <p className="font-medium text-sm text-text-primary flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {new Date(booking.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
            <p className="font-medium text-sm text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {booking.scheduled_time.substring(0,5)}
            </p>
          </div>
          <div className="card p-4">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Payment</h3>
            <p className="font-mono font-bold text-lg text-primary mb-1">₹{booking.total_amount}</p>
            <p className="text-xs font-medium text-success flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Paid via Stripe
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Service Address</h3>
          <p className="text-sm font-medium leading-relaxed">
            {booking.address_snapshot?.full_address || 'Address not available'}
          </p>
        </div>

        {isActive && (
          <button 
            onClick={handleCancelBooking}
            className="w-full py-4 rounded-xl text-error font-syne font-bold border border-error/30 bg-error/5 hover:bg-error/10 transition-colors"
          >
            Cancel Booking
          </button>
        )}
      </div>

      {booking.status === 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-30 pb-safe">
            <button className="w-full btn-primary py-4 text-lg rounded-2xl shadow-lg flex justify-center items-center gap-2">
              <span className="text-rating text-xl">★</span>
              Rate Your Experience
            </button>
        </div>
      )}
    </div>
  );
}
