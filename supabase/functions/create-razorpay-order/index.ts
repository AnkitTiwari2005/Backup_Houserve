// Supabase Edge Function: create-razorpay-order
// Replaces create-payment-intent (Stripe) with Razorpay Orders API
// Maintains identical auth flow and server-side price calculation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    // Return 401 immediately if no auth header present
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
       return new Response(JSON.stringify({ error: "Edge Function misconfigured: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // SECURE: Initialize client with the user's JWT to verify authenticity
    const jwt = authHeader.replace('Bearer ', '').trim();
    
    // Debug info: Match check
    const isTargetProject = supabaseUrl.includes('wwnbbjvxrhjjwfshtxto');
    console.log(`[AUTH] Verifying JWT for project match: ${isTargetProject}`);

    // Create a regular client for verification
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Strategy 1: Standard getUser verify
    let { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    // Strategy 2: Resilience Fallback (Sometimes Deno environment has signature mismatches with native app tokens)
    if (authError || !user) {
      console.warn('Strategy 1 failed, trying Strategy 2 (Admin verification)...');
      try {
        const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(jwt);
        
        if (!adminError && adminData.user) {
          user = adminData.user;
          authError = null;
          console.log('[OK] Strategy 2 succeeded');
        }
      } catch (e) {
        console.error('Strategy 2 crash:', e);
      }
    }

    if (authError || !user) {
      console.error('JWT verification failed:', authError?.message);
      return new Response(JSON.stringify({ 
        error: 'Invalid JWT', 
        details: authError?.message || 'Token could not be validated.',
        diagnostics: {
          project_match: isTargetProject,
          url_used: supabaseUrl.substring(0, 20) + '...',
          auth_error: authError
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = user.id;
    const userEmail = user.email || 'unknown';
    console.log(`[OK] Verified User: ${userEmail} | ID: ${userId}`);

    // Parse request body
    const { items, description } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart items are required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const serviceIds = items.map((item: any) => item.serviceId);
    const { data: services, error: dbError } = await supabaseClient
      .from('services')
      .select('id, name, price')
      .in('id', serviceIds);

    if (dbError || !services || services.length === 0) {
      console.error('DB error:', dbError?.message);
      return new Response(JSON.stringify({ error: `Database error: ${dbError?.message || 'No services found'}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // SERVER-SIDE CALCULATION (Authoritative)
    let subtotal = 0;
    services.forEach((service: any) => {
      const cartItem = items.find((i: any) => i.serviceId === service.id);
      if (cartItem) {
        subtotal += Number(service.price) * (cartItem.quantity || 1);
      }
    });

    const platformFee = 50;
    const gst = Math.round((subtotal + platformFee) * 0.18);
    const total = subtotal + platformFee + gst;

    console.log(`[PAYMENT] Total: ₹${total} | Subtotal: ₹${subtotal} | GST: ₹${gst}`);

    // Create Razorpay Order
    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const orderPayload = {
      amount: Math.round(total * 100), // Razorpay accepts amount in paise
      currency: 'INR',
      receipt: `houserve_${Date.now()}_${userId.substring(0, 8)}`,
      notes: {
        user_id: userId,
        user_email: userEmail,
        items_count: items.length.toString(),
        description: description || `Houserve Booking - ${userEmail}`
      }
    };

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload)
    });

    const razorpayData = await razorpayRes.json();

    if (!razorpayRes.ok || razorpayData.error) {
      const errMsg = razorpayData.error?.description || razorpayData.error?.code || 'Unknown Razorpay error';
      console.error('Razorpay error:', errMsg);
      return new Response(JSON.stringify({ error: `Razorpay: ${errMsg}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[OK] Razorpay Order created: ${razorpayData.id}`);

    return new Response(
      JSON.stringify({
        orderId: razorpayData.id,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        key_id: RAZORPAY_KEY_ID,
        breakdown: { subtotal, platformFee, gst, total }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (error: any) {
    console.error("CRITICAL Error:", error.message);
    return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
