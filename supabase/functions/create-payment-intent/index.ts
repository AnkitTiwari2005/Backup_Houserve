// Supabase Edge Function: create-payment-intent
// v3.0 - BYPASS JWT VERIFICATION: Decode payload manually, use service role for DB
// JWT signature issues bypass: apikey header secures the request at the gateway level

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cryptographic verification is enforced by calling supabaseAdmin.auth.getUser()

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

    if (!STRIPE_SECRET_KEY) {
       return new Response(JSON.stringify({ error: "Edge Function misconfigured: STRIPE_SECRET_KEY not set." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Use ANON_KEY to initialize the client
    const supabaseClient = createClient(supabaseUrl, anonKey);

    // SECURE: Cryptographically verify the JWT by fetching the user from the Auth server
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('JWT verification failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token. Please login again.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = user.id;
    const userEmail = user.email || 'unknown';
    console.log(`[OK] Secured User: ${userEmail} | ID: ${userId}`);

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

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(total * 100).toString(),
        currency: 'inr',
        'automatic_payment_methods[enabled]': 'true',
        description: description || `Boys@Work Booking - ${userEmail}`,
        'metadata[user_id]': userId,
        'metadata[items_count]': items.length.toString()
      })
    });

    const stripeData = await stripeRes.json();
    if (stripeData.error) {
      console.error('Stripe error:', stripeData.error.message);
      return new Response(JSON.stringify({ error: `Stripe: ${stripeData.error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        clientSecret: stripeData.client_secret,
        amount: Math.round(total * 100),
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
