// Supabase Edge Function: create-payment-intent
// v2.9 - Security Hardened (No hardcoded keys)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// SECURE: Stripe key is now fetched from Supabase Vault/Secrets
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
    const authHeader = req.headers.get('Authorization')!;

    if (!STRIPE_SECRET_KEY) {
       return new Response(JSON.stringify({ error: "Edge Function misconfigured: STRIPE_SECRET_KEY not set in Supabase Secrets." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No Authorization header found. Please login." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: `AUTH FAIL: ${authError?.message || 'Invalid session'}.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { serviceIds, description } = await req.json();

    const { data: services, error: dbError } = await supabaseClient
      .from('services')
      .select('id, name, price')
      .in('id', serviceIds);

    if (dbError || !services || services.length === 0) {
      return new Response(JSON.stringify({ error: `DB FAIL: ${dbError?.message || 'Services not found'}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const subtotal = services.reduce((acc, s) => acc + Number(s.price), 0);
    const platformFee = 50;
    const gst = subtotal * 0.18;
    const total = subtotal + platformFee + gst;

    console.log(`Verified Total: ₹${total.toFixed(2)} for ${user.email}`);

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
        'metadata[user_id]': user.id
      })
    });

    const stripeData = await stripeRes.json();
    if (stripeData.error) throw new Error(`Stripe API: ${stripeData.error.message}`);

    return new Response(JSON.stringify({ clientSecret: stripeData.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `GLOBAL FAIL: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})
