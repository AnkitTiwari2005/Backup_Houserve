import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useAddressStore } from '../stores/addressStore';
import { supabase } from '../lib/supabase';
import { sendAdminOrderNotification } from '../lib/notifications';

// Razorpay type declaration for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
  console.warn('Backend Warning: VITE_RAZORPAY_KEY_ID is missing. Payment initialization will fail.');
}


export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { selectedAddress } = useAddressStore();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [authBreakdown, setAuthBreakdown] = useState<any>(null);

  const bookingDetails = location.state;

  useEffect(() => {
    // ONLY redirect to cart on INITIAL LOAD if cart is empty.
    if (!bookingDetails || items.length === 0) {
      const timer = setTimeout(() => {
        if (!bookingDetails || items.length === 0) {
          navigate('/cart', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // Proactive check for Razorpay key
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    if (!razorpayKey || razorpayKey.length < 10) {
      setInitError('Razorpay Configuration Incomplete: VITE_RAZORPAY_KEY_ID is missing or invalid in your .env file.');
      setLoading(false);
      return;
    }

    // Check that Razorpay SDK is loaded
    if (typeof window.Razorpay === 'undefined') {
      setInitError('Razorpay SDK failed to load. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    // SECURE: Call Supabase Edge Function to create Razorpay Order
    const createRazorpayOrder = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.access_token) {
          throw new Error('Active session lost. Please login again using the button below.');
        }

        const token = session.access_token;

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.trim()}`,
            'apikey': (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
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
          const detail = result.details || result.error || result.message || 'Unknown server error';
          if (result.diagnostics) setDiagnostics(result.diagnostics);
          throw new Error(detail);
        }

        if (result.orderId) {
          setOrderData(result);
          if (result.breakdown) {
            setAuthBreakdown(result.breakdown);
          }
        } else {
          throw new Error('No order ID received from payment server.');
        }
      } catch (err: any) {
        console.error('Payment Initialization Failed:', err);
        setInitError(err.message || 'Could not initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createRazorpayOrder();
  }, [bookingDetails, items, navigate, profile]);

  // Correctly format time: '01:00 PM' -> '13:00'
  const formatTimeTo24h = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    const [h, minutes] = time.split(':');
    let hours = h;
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString().padStart(2, '0');
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const verifyPaymentOnServer = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token.trim()}`,
          'apikey': (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }),
      });

      const result = await response.json();
      return result.verified === true;
    } catch (err) {
      console.error('Payment verification failed:', err);
      return false;
    }
  };

  const handlePayment = useCallback(async () => {
    if (!orderData || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Houserve',
        description: `Booking for ${items.map(i => i.service.name).join(', ')}`,
        image: 'https://wwnbbjvxrhjjwfshtxto.supabase.co/storage/v1/object/public/assets/icon.png',
        order_id: orderData.orderId,
        prefill: {
          name: profile?.full_name || '',
          email: profile?.email || '',
          contact: profile?.phone || selectedAddress?.phone || ''
        },
        theme: {
          color: '#F3732A',
          backdrop_color: 'rgba(0,0,0,0.6)'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment was cancelled. You can try again.');
          },
          confirm_close: true,
          escape: true,
          animation: true
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 1. Verify payment signature on server
            const isVerified = await verifyPaymentOnServer(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (!isVerified) {
              throw new Error('Payment signature verification failed. Please contact support.');
            }

            // 2. Create booking in database
            const allServiceNames = items.map(i => i.service.name).join(', ');
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
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              payment_status: 'paid'
            };

            const { data, error: dbError } = await supabase
              .from('bookings')
              .insert(newBooking)
              .select()
              .single();

            if (dbError) throw dbError;

            // 2.5 Insert multi-service line items (Audit Fix 2.3)
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
            }

            // 3. Send Admin Email Notification
            console.log("FINALIZING NOTIFICATION PAYLOAD...");
            const notificationResult = await sendAdminOrderNotification({
              booking_ref: data.booking_ref,
              service_name: allServiceNames,
              items: items.map(i => ({ name: i.service.name, quantity: i.quantity })),
              scheduled_date: newBooking.scheduled_date,
              scheduled_time: bookingDetails.preferredTime,
              total_amount: newBooking.total_amount,
              address_snapshot: selectedAddress,
              phone: selectedAddress?.phone,
              special_instructions: newBooking.special_instructions
            }, profile);

            if (!notificationResult.success) {
              console.error("CRITICAL: Admin Notification Bridge Failed!", notificationResult.error);
            } else {
              console.log("SUCCESS: Notification dispatched to Edge Function.");
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

          } catch (err: any) {
            console.error('Post-payment processing error:', err);
            setError(err.message || 'Payment succeeded but booking creation failed. Please contact support.');
            setProcessing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        const errorMsg = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
        setError(errorMsg);
        setProcessing(false);
      });

      razorpayInstance.open();

    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Could not open payment window. Please try again.');
      setProcessing(false);
    }
  }, [orderData, processing, items, profile, selectedAddress, bookingDetails, authBreakdown, clearCart, navigate]);

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
        {/* Order Summary Card */}
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

          {/* Price Breakdown */}
          {authBreakdown && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">₹{authBreakdown.subtotal}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Platform Fee</span>
                <span className="font-mono">₹{authBreakdown.platformFee}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST (18%)</span>
                <span className="font-mono">₹{authBreakdown.gst}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border">
            <span className="font-syne font-bold text-accent">Total to Pay</span>
            <span className="font-mono font-bold text-primary text-xl">₹{authBreakdown?.total || bookingDetails.total}</span>
          </div>
        </div>

        {/* Error State */}
        {initError ? (
          <div className="card border-error/20 bg-error/5 text-center py-8">
            <svg className="w-12 h-12 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h3 className="font-syne font-bold text-error mb-2 text-lg">Payment Failed to Initialize</h3>
            <p className="text-sm text-text-secondary mb-4 px-4">{initError}</p>
            {diagnostics && (
              <div className="mx-4 mb-6 p-3 bg-white/50 rounded-xl border border-error/10 text-[10px] font-mono text-left text-error/70 break-all overflow-y-auto max-h-[100px]">
                <div className="font-bold mb-1 opacity-50 uppercase tracking-tighter">Debug Data:</div>
                {JSON.stringify(diagnostics, null, 1)}
              </div>
            )}
            <div className="flex flex-col gap-3 px-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  await supabase.auth.signOut();
                  navigate('/login', { replace: true });
                }}
                className="w-full py-3 text-sm font-medium text-text-secondary hover:text-primary transition-colors border border-border rounded-xl"
              >
                Account / Switch User
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center flex-col items-center py-12 card border border-border border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-medium text-text-secondary animate-pulse">Initializing Secure Payment Gateway...</p>
          </div>
        ) : orderData && (
          <div className="space-y-4">
            {/* Payment Form Card */}
            <div className="bg-white p-5 rounded-3xl shadow-card border border-border space-y-6">
              <div className="flex items-center gap-2 text-success font-syne font-bold mb-2 bg-success/10 p-3 rounded-xl border border-success/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure Payment via Razorpay
              </div>

              {/* Razorpay Info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">🏦</div>
                  <div>
                    <p className="font-medium text-sm text-accent">Multiple Payment Options</p>
                    <p className="text-xs text-text-secondary">UPI, Cards, Wallets, Net Banking & more</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 text-error p-3 rounded-lg text-sm flex items-start gap-2 border border-error/20">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <button
                disabled={processing}
                onClick={handlePayment}
                className="w-full btn-primary py-4 text-lg rounded-2xl flex justify-center items-center gap-2 shadow-lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  `Pay ₹${authBreakdown?.total || bookingDetails.total} Now`
                )}
              </button>

              <p className="text-center text-xs text-text-secondary mt-4">
                Your payment is securely processed by Razorpay. Houserve does not store your card details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
