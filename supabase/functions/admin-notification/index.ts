// Supabase Edge Function: admin-notification
// v2.2 - Security Hardened (No hardcoded keys)
// Deploy with: supabase functions deploy admin-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// SECURE: Resend key is now fetched from Supabase Vault/Secrets
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAILS = ["12328.uspc@gmail.com"]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("Edge Function (v2.2) received a request...");

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Edge Function misconfigured: RESEND_API_KEY not set in Supabase Secrets." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // STANDARD: Use 500 for server misconfiguration
      })
    }

    const body = await req.json();
    console.log("Edge Function Received Payload:", JSON.stringify(body));

    const booking = body.booking || {};
    const customerProfile = body.customerProfile || {};

    const customerPhone = booking.phone || customerProfile.phone || 'N/A';

    const emailBody = `
      <h2>New Booking Confirmed (Boys@Work)</h2>
      <p><strong>Booking Ref:</strong> ${booking?.booking_ref || 'N/A'}</p>
      <p><strong>Customer Name:</strong> ${customerProfile?.full_name || 'Generic User'}</p>
      <p><strong>Customer Email:</strong> ${customerProfile?.email || 'No email'}</p>
      <p><strong>Customer Phone:</strong> ${customerPhone}</p>
      <p><strong>Service:</strong> ${booking?.service_name || 'Unknown Service'}</p>
      <p><strong>Date:</strong> ${booking?.scheduled_date || 'N/A'}</p>
      <p><strong>Time:</strong> ${booking?.scheduled_time || 'N/A'}</p>
      <p><strong>Amount Paid:</strong> ₹${booking?.total_amount || '0'}</p>
      <p><strong>Address:</strong> ${booking?.address || 'N/A'}</p>
      <p><strong>Instructions:</strong> ${booking?.special_instructions || 'None'}</p>
    `

    console.log(`Sending email to ${ADMIN_EMAILS.join(", ")} via Resend...`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Boys@Work <onboarding@resend.dev>',
        to: ADMIN_EMAILS,
        subject: `New Order: ${booking.booking_ref} - ${booking.service_name}`,
        html: emailBody,
      }),
    })

    const data = await res.json();
    console.log("Resend API response:", JSON.stringify(data));

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: `Resend API Error: ${data.message || res.statusText}`,
        code: data.name,
        details: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status, // STANDARD: Passthrough the status from Resend
      })
    }

    return new Response(JSON.stringify({ success: true, resendData: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message, status: 'internal_error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // STANDARD: Use 500 for internal crashes
    })
  }
})
