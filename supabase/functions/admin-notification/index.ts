// Supabase Edge Function: admin-notification
// v19.0 - Production (Secrets-based, no hardcoded keys)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// SECURE: All credentials from Supabase Secrets
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAILS') || '12328.uspc@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("=== admin-notification v19.0 invoked ===")

  try {
    // Validate API key exists
    if (!RESEND_API_KEY) {
      console.error("FATAL: RESEND_API_KEY secret is missing!")
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Server misconfigured: RESEND_API_KEY not set in Supabase Secrets." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always 200 so frontend can read error
      })
    }

    const body = await req.json()
    console.log("Payload keys:", Object.keys(body))

    const booking = body.booking || {}
    const customerProfile = body.customerProfile || {}
    const items = booking?.items || []

    // DEFENSIVE: Handle both normalized (address_snapshot) and denormalized (address string)
    const address = booking?.address_snapshot?.full_address 
      || booking?.address 
      || 'N/A'

    // Phone: bookings table has no phone column, pull from profile or address
    const phone = customerProfile?.phone || booking?.phone || 'N/A'

    // Build items table HTML
    let itemsHtml = ''
    if (items.length > 0) {
      itemsHtml = `
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f17228; color: white;">
            <th>Service</th>
            <th style="text-align: center;">Qty</th>
          </tr>
          ${items.map((i: any) => `
            <tr>
              <td>${i.name || i.service_name || 'Service'}</td>
              <td style="text-align: center;"><strong>${i.quantity || 1}</strong></td>
            </tr>
          `).join('')}
        </table>`
    } else {
      itemsHtml = `<p><strong>Service:</strong> ${booking?.service_name || 'N/A'}</p>`
    }

    const bookingRef = booking.booking_ref || 'HS-ORDER'
    const amount = booking.total_amount || 0
    const addrSnippet = (address || '').split(',')[0] || 'Delhi'

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
        <h2 style="color: #f17228; border-bottom: 2px solid #f17228; padding-bottom: 10px;">
          New Booking Confirmed (Houserve)
        </h2>
        <p><strong>Booking Ref:</strong> ${bookingRef}</p>
        <div style="background: #fff8f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customerProfile?.full_name || 'User'}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${customerProfile?.email || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${phone}</p>
        </div>
        <h3>Order Details:</h3>
        ${itemsHtml}
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
        <p><strong>Scheduled:</strong> ${booking?.scheduled_date || 'N/A'} at ${booking?.scheduled_time || 'N/A'}</p>
        <p><strong>Total:</strong> ₹${amount}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Instructions:</strong> ${booking?.special_instructions || 'None'}</p>
      </div>`

    const subject = `🚀 [NEW ORDER] ${bookingRef} | ₹${amount} | ${addrSnippet}`

    console.log(`Sending to ${ADMIN_EMAIL} via Resend...`)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Houserve <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject,
        html: emailHtml,
      }),
    })

    const resendData = await resendRes.json()
    console.log("Resend status:", resendRes.status, "Data:", JSON.stringify(resendData))

    if (!resendRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: resendData.message || resendRes.statusText,
        details: resendData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ success: true, resendData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: any) {
    console.error("Edge Function crash:", err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
