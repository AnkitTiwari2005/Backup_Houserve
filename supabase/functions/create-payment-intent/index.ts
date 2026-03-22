// Supabase Edge Function: create-payment-intent
// v2.10 - Audit v2.0 Fixes: Quantity Handling, Standardized Pricing, Standard HTTP Codes
// Deploy with: supabase functions deploy create-payment-intent

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!STRIPE_SECRET_KEY) {
       return new Response(JSON.stringify({ error: "Edge Function misconfigured: STRIPE_SECRET_KEY not set." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // New payload: [{ serviceId: string, quantity: number }]
    const { items, description } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart items are required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const serviceIds = items.map(item => item.serviceId);
    const { data: services, error: dbError } = await supabaseClient
      .from('services')
      .select('id, name, price')
      .in('id', serviceIds);

    if (dbError || !services) {
      return new Response(JSON.stringify({ error: "Database error fetching services." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // SERVER-SIDE CALCULATION (Authoritative)
    let subtotal = 0;
    services.forEach(service => {
      const cartItem = items.find(i => i.serviceId === service.id);
      if (cartItem) {
        subtotal += Number(service.price) * cartItem.quantity;
      }
    });

    const platformFee = 50; // Standardized to 50
    const gst = Math.round((subtotal + platformFee) * 0.18);
    const total = subtotal + platformFee + gst;

    console.log(`[AUTH] Total: ₹${total} for ${user.email} (Items: ${items.length})`);

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
        description: description || `Boys@Work Booking - ${user.email}`,
        'metadata[user_id]': user.id,
        'metadata[items_count]': items.length.toString()
      })
    });

    const stripeData = await stripeRes.json();
    if (stripeData.error) {
      return new Response(JSON.stringify({ error: `Stripe API: ${stripeData.error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ clientSecret: stripeData.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Payment Intent Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
