// Supabase Edge Function: admin-notification
// Sends dual emails via Brevo (Sendinblue): Customer Receipt & Admin Alert

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
// Hardcoded per your instructions
const ADMIN_EMAILS = [
  { email: 'shivskukreja@gmail.com', name: 'Admin Shivs' },
  { email: '12328.uspc@gmail.com', name: 'Admin USPC' }
]
const SENDER = { name: "Houserve Bookings", email: "12328.uspc@gmail.com" }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("=== order-notification (Brevo) invoked ===")

  try {
    if (!BREVO_API_KEY) {
      console.error("FATAL: BREVO_API_KEY secret is missing!")
      return new Response(JSON.stringify({ success: false, error: "BREVO_API_KEY not set" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const body = await req.json()
    const booking = body.booking || {}
    const customerProfile = body.customerProfile || {}
    const items = booking?.items || []

    const address = booking?.address_snapshot?.full_address || booking?.address || 'N/A'
    const phone = customerProfile?.phone || booking?.phone || 'N/A'
    const bookingRef = booking.booking_ref || 'HS-ORDER'
    const amount = booking.total_amount || 0

    // ------ 1. HTML FOR ADMIN ------
    const adminItemsHtml = items.length > 0
      ? `<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f17228; color: white;"><th>Service</th><th style="text-align: center;">Qty</th></tr>
          ${items.map((i: any) => `<tr><td>${i.name || i.service_name || 'Service'}</td><td style="text-align: center;"><strong>${i.quantity || 1}</strong></td></tr>`).join('')}
         </table>`
      : `<p><strong>Service:</strong> ${booking?.service_name || 'N/A'}</p>`

    const adminHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
        <h2 style="color: #f17228; border-bottom: 2px solid #f17228; padding-bottom: 10px;">New Booking Confirmed</h2>
        <p><strong>Booking Ref:</strong> ${bookingRef}</p>
        <div style="background: #fff8f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customerProfile?.full_name || 'User'}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${customerProfile?.email || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${phone}</p>
        </div>
        <h3>Order Details:</h3>
        ${adminItemsHtml}
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
        <p><strong>Scheduled:</strong> ${booking?.scheduled_date || 'N/A'} at ${booking?.scheduled_time || 'N/A'}</p>
        <p><strong>Total:</strong> ₹${amount}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Instructions:</strong> ${booking?.special_instructions || 'None'}</p>
      </div>`

    // ------ 2. HTML FOR CUSTOMER ------
    const customerItemsHtml = items.length > 0 
      ? items.map((i: any) => `
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; color: #444;">${i.name || i.service_name || 'Service'}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #333;"><strong>x${i.quantity || 1}</strong></td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; color: #444;">${booking?.service_name || 'Service'}</td></tr>`;

    const customerHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #F3732A; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Houserve</h1>
          <p style="color: #777777; font-size: 15px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Booking Confirmed</p>
        </div>
        
        <div style="background-color: #fff8f5; border-left: 4px solid #F3732A; padding: 18px; margin-bottom: 25px; border-radius: 4px;">
          <p style="margin: 0; font-size: 17px; color: #333;"><strong>Hi ${customerProfile?.full_name?.split(' ')[0] || 'Customer'},</strong></p>
          <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">Thank you for choosing Houserve. Your booking has been successfully confirmed and our professional will arrive on time.</p>
        </div>

        <h3 style="color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Your Booking Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; font-size: 15px;">
          <tr>
            <td style="padding: 10px 0; color: #666;">Booking Ref:</td>
            <td style="padding: 10px 0; text-align: right; color: #111; font-weight: 600;">${bookingRef}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Date & Time:</td>
            <td style="padding: 10px 0; text-align: right; color: #111; font-weight: 600;">${booking?.scheduled_date} at ${booking?.scheduled_time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; vertical-align: top;">Address:</td>
            <td style="padding: 10px 0; text-align: right; color: #333;">${address}</td>
          </tr>
        </table>

        <h3 style="color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Order Summary</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border-radius: 8px; overflow: hidden; margin-bottom: 25px; font-size: 15px;">
          ${customerItemsHtml}
          <tr>
            <td style="padding: 15px 10px; color: #222; font-weight: bold; font-size: 16px;">Total Amount Paid</td>
            <td style="padding: 15px 10px; text-align: right; color: #F3732A; font-weight: bold; font-size: 18px;">₹${amount}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 13px;">If you have any questions, contact us at support@houserve.in</p>
          <p style="color: #aaa; font-size: 12px;">© ${new Date().getFullYear()} Houserve. All rights reserved.</p>
        </div>
      </div>`

    // ====== SEND BREVO EMAILS CONCURRENTLY ======
    const brevoUrl = 'https://api.brevo.com/v3/smtp/email'
    const headers = {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    }

    const promises = []

    // 1. Fire Admin Email
    const adminSnippet = (address || '').split(',')[0] || 'Local'
    promises.push(
      fetch(brevoUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sender: SENDER,
          to: ADMIN_EMAILS,
          subject: `🚀 [NEW ORDER] ${bookingRef} | ₹${amount} | ${adminSnippet}`,
          htmlContent: adminHtml
        })
      }).then(r => r.json())
    )

    // 2. Fire Customer Email (if they have an email)
    if (customerProfile?.email) {
      promises.push(
        fetch(brevoUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sender: SENDER,
            to: [{ email: customerProfile.email, name: customerProfile.full_name || 'Customer' }],
            subject: `Your Houserve Booking is Confirmed! 🎉`,
            htmlContent: customerHtml
          })
        }).then(r => r.json())
      )
    }

    // Await both dispatches
    const results = await Promise.all(promises)
    console.log("Brevo Dispatches Complete:", JSON.stringify(results))

    return new Response(JSON.stringify({ success: true, results }), {
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
