// Supabase Edge Function: verify-razorpay-payment
// Securely verifies Razorpay payment signature using HMAC-SHA256
// This ensures payment data has not been tampered with

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HMAC-SHA256 signature verification using Web Crypto API (Deno compatible)
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    // Auth check
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Edge Function misconfigured: RAZORPAY_KEY_SECRET not set." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Verify user JWT
    const jwt = authHeader.replace('Bearer ', '').trim();
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    // Fallback to admin verification
    if (authError || !user) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(jwt);
        if (!adminError && adminData.user) {
          user = adminData.user;
          authError = null;
        }
      } catch (e) {
        console.error('Admin auth fallback failed:', e);
      }
    }

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid JWT', details: authError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log(`[VERIFY] User: ${user.email} | ID: ${user.id}`);

    // Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verify HMAC-SHA256 signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      console.error(`[VERIFY] SIGNATURE MISMATCH for order: ${razorpay_order_id}`);
      return new Response(JSON.stringify({ 
        verified: false, 
        error: 'Payment signature verification failed. Possible tampering detected.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[VERIFY] ✅ Signature valid for order: ${razorpay_order_id} | payment: ${razorpay_payment_id}`);

    return new Response(
      JSON.stringify({ 
        verified: true, 
        razorpay_order_id,
        razorpay_payment_id
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
