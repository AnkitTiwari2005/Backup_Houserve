import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useAddressStore } from '../stores/addressStore';
import { supabase } from '../lib/supabase';
import { sendAdminOrderNotification } from '../lib/notifications';

// Initialize Stripe outside component
// Using the test key provided in prompt
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  console.warn('Backend Warning: VITE_STRIPE_PUBLISHABLE_KEY is missing. Payment initialization will fail.');
}


function CheckoutForm({ bookingDetails, authBreakdown }: { bookingDetails: any, authBreakdown: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart, items } = useCartStore();
  const { selectedAddress } = useAddressStore();
  const { profile } = useAuthStore();
  
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // 1. Confirm payment with Stripe
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // Avoid immediate redirect, handle manually
      });

      if (paymentError) {
        throw new Error(paymentError.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const allServiceNames = items.map(i => i.service.name).join(', ');
        
        // Correctly format time: '01:00 PM' -> '13:00'
        const formatTimeTo24h = (time12h: string) => {
          const [time, modifier] = time12h.split(' ');
          const [h, minutes] = time.split(':');
          let hours = h;
          if (hours === '12') hours = '00';
          if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString().padStart(2, '0');
          return `${hours.padStart(2, '0')}:${minutes}`;
        };

        const finalPrices = authBreakdown || bookingDetails;

        const newBooking = {
          customer_id: profile?.id,
          service_id: items[0]?.service.id,
          status: 'confirmed',
          scheduled_date: bookingDetails.preferredDate,
          scheduled_time: formatTimeTo24h(bookingDetails.preferredTime),
          address_id: selectedAddress?.id,
          address_snapshot: {
            ...selectedAddress,
            phone: selectedAddress?.phone
          },
          special_instructions: bookingDetails.specialInstructions,
          subtotal: finalPrices.subtotal,
          platform_fee: finalPrices.platformFee,
          gst_amount: finalPrices.gst,
          total_amount: finalPrices.total,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_status: 'paid'
        };

        const { data, error: dbError } = await supabase
          .from('bookings')
          .insert(newBooking)
          .select()
          .single();
        
        if (dbError) throw dbError;

        // 2.5 Insert multi-service line items (Audit Fix #5.3)
        const bookingItems = items.map(item => ({
          booking_id: data.id,
          service_id: item.service.id,
          quantity: item.quantity,
          unit_price: item.service.price,
          total_price: item.service.price * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);

        if (itemsError) {
          console.error("Operational Warning: Multi-item storage failed", itemsError);
          // Non-blocking for the user, but should be logged
        }

        // 3. Send Admin Email Notification
        const notificationResult = await sendAdminOrderNotification({
          booking_ref: data.booking_ref,
          service_name: allServiceNames,
          scheduled_date: bookingDetails.preferredDate,
          scheduled_time: bookingDetails.preferredTime,
          total_amount: bookingDetails.total,
          address: selectedAddress?.full_address,
          phone: selectedAddress?.phone,
          special_instructions: bookingDetails.specialInstructions
        }, profile);

        if (!notificationResult.success) {
          console.error("Operational Warning: Admin Notification Failed", notificationResult.error);
        }

        // 4. Also add notification
        await supabase.from('notifications').insert({
          user_id: profile?.id,
          title: 'Booking Confirmed! 🎉',
          body: `Your booking for ${allServiceNames} is confirmed for ${bookingDetails.preferredDate} at ${bookingDetails.preferredTime}`,
          type: 'booking',
          booking_id: data.id
        });

        // Clear cart and go to success
        clearCart();
        navigate('/booking-success', { 
          state: { bookingRef: data.booking_ref, bookingId: data.id },
          replace: true 
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 rounded-3xl shadow-card border border-border">
      <div className="flex items-center gap-2 text-success font-syne font-bold mb-4 bg-success/10 p-3 rounded-xl border border-success/20">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        Secure Payment via Stripe
      </div>

      <PaymentElement options={{ 
        layout: 'tabs'
      }} />

      {error && (
        <div className="bg-error/10 text-error p-3 rounded-lg text-sm flex items-start gap-2 border border-error/20">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <button
        disabled={!stripe || processing}
        type="submit"
        className="w-full btn-primary py-4 text-lg rounded-2xl flex justify-center items-center gap-2 shadow-lg"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          `Pay ₹${bookingDetails.total} Now`
        )}
      </button>

      <p className="text-center text-xs text-text-secondary mt-4">
        Your payment is securely processed by Stripe. Boys@Work does not store your card details.
      </p>
    </form>
  );
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { profile } = useAuthStore();
  
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [authBreakdown, setAuthBreakdown] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const bookingDetails = location.state;

  useEffect(() => {
    // ONLY redirect to cart on INITIAL LOAD if cart is empty.
    // If we've already started the checkout process, don't redirect back even if cart is cleared.
    if (!bookingDetails || items.length === 0) {
      // Small buffer to ensure we aren't just in the middle of a successful transition
      const timer = setTimeout(() => {
        if (!bookingDetails || items.length === 0) {
          navigate('/cart', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // SECURE: Call Supabase Edge Function to create PaymentIntent
    const createPaymentIntent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session found');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            items: items.map(item => ({
              serviceId: item.service.id,
              quantity: item.quantity
            })),
            description: `Booking for ${items.map(i => i.service.name).join(', ')}`
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
        }

        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
          // AUTHORITATIVE: Update local state with server-calculated totals (Audit fix #5.1)
          if (result.breakdown) {
            setAuthBreakdown(result.breakdown);
          }
        } else {
          throw new Error('No client secret received from payment server.');
        }
      } catch (err: any) {
        console.error('Payment Initialization Failed:', err);
        setInitError(err.message || 'Could not initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingDetails, items, navigate, profile]);

  if (!bookingDetails) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="bg-surface p-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 border border-border rounded-full hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-xl font-syne font-bold text-accent">Checkout</h1>
      </div>

      <div className="p-4 space-y-6 flex-1 max-w-lg w-full mx-auto">
        <div className="card text-sm space-y-3">
          <h3 className="font-syne font-bold text-base text-accent border-b border-border pb-2">Order Review</h3>
          <div className="flex justify-between">
            <span className="text-text-secondary">Services ({items.length})</span>
            <span className="font-medium text-right line-clamp-1 flex-1 ml-4 justify-end flex">
              {items.map(i => i.service.name).join(', ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Schedule</span>
            <span className="font-medium">{bookingDetails.preferredDate} at {bookingDetails.preferredTime}</span>
          </div>
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border">
            <span className="font-syne font-bold text-accent">Total to Pay</span>
            <span className="font-mono font-bold text-primary text-xl">₹{bookingDetails.total}</span>
          </div>
        </div>

        {initError ? (
          <div className="card border-error/20 bg-error/5 text-center py-8">
            <svg className="w-12 h-12 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h3 className="font-syne font-bold text-error mb-2 text-lg">Payment Failed to Initialize</h3>
            <p className="text-sm text-text-secondary mb-6 px-4">{initError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center flex-col items-center py-12 card border border-border border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-medium text-text-secondary animate-pulse">Initializing Secure Payment Gateway...</p>
          </div>
        ) : clientSecret && (
          <Elements options={{ 
            clientSecret, 
            appearance: { 
              theme: 'stripe',
              variables: {
                colorPrimary: '#F3732A',
                colorBackground: '#ffffff',
                colorText: '#1A1A2E',
                colorDanger: '#EF4444',
                fontFamily: 'DM Sans, sans-serif',
                spacingUnit: '4px',
                borderRadius: '12px',
              }
            } 
          }} stripe={stripePromise}>
            <CheckoutForm bookingDetails={bookingDetails} authBreakdown={authBreakdown} />
          </Elements>
        )}
      </div>
    </div>
  );
}
