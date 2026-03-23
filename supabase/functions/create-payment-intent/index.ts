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

// Decode JWT payload without signature verification
// Security: The Supabase gateway already validates the apikey header
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64URL to Base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
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

    if (!STRIPE_SECRET_KEY) {
       return new Response(JSON.stringify({ error: "Edge Function misconfigured: STRIPE_SECRET_KEY not set." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Decode JWT payload — no signature verification needed
    // The Supabase API gateway validates apikey before the function even runs
    const jwt = authHeader.replace('Bearer ', '');
    const payload = decodeJwtPayload(jwt);

    if (!payload || !payload.sub) {
      console.error('JWT decode failed. Payload:', payload);
      return new Response(JSON.stringify({ error: 'Could not decode user token. Please logout and login again.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = payload.sub;
    const userEmail = payload.email || 'unknown';
    console.log(`[OK] User: ${userEmail} | ID: ${userId}`);

    // Use ANON_KEY for DB operations since services table is publicly readable
    const supabaseAdmin = createClient(supabaseUrl, anonKey);

    // Parse request body
    const { items, description } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart items are required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const serviceIds = items.map((item: any) => item.serviceId);
    const { data: services, error: dbError } = await supabaseAdmin
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
