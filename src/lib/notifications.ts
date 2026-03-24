import { supabase } from './supabase';

export async function initializeNotifications() {
  console.log('Push notifications are currently decommissioned to ensure app stability.');
  return { success: true };
}

export async function sendAdminOrderNotification(booking: any, customerProfile: any) {
  try {
    console.log('--- ADMIN NOTIFICATION TRIGGERED ---');
    console.log('Booking Payload:', JSON.stringify(booking));
    console.log('Customer Profile:', JSON.stringify(customerProfile));

    // ===== DIRECT FETCH instead of supabase.functions.invoke() =====
    // This bypasses the Supabase SDK's JWT verification and error masking.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const functionUrl = `${supabaseUrl}/functions/v1/admin-notification`;

    console.log('Calling Edge Function at:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ booking, customerProfile }),
    });

    const responseText = await response.text();
    console.log('Edge Function raw response:', response.status, responseText);

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: `Non-JSON response: ${responseText}` };
    }

    if (!response.ok) {
      const errMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('Edge Function HTTP error:', errMsg);
      throw new Error(errMsg);
    }

    if (data?.error) {
      console.error('Edge Function returned error in body:', data.error);
      throw new Error(data.error);
    }

    console.log('--- NOTIFICATION SUCCESS ---');
    console.log('Result:', JSON.stringify(data));

    return { success: true, data };

  } catch (error: any) {
    console.error('Notification failed:', error);

    // Write failure telemetry so the user can see the EXACT error
    await supabase.from('notifications').insert({
      user_id: customerProfile?.id,
      title: 'Email Failed ❌',
      body: `${error.message}`,
      type: 'info'
    });

    return {
      success: false,
      error: error.message || 'Unknown Error',
    };
  }
}
