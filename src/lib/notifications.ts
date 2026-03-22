import { supabase } from './supabase';

export async function sendAdminOrderNotification(booking: any, customerProfile: any) {
  try {
    console.log('--- ADMIN NOTIFICATION TRIGGERED ---');
    console.log('Booking Payload:', JSON.stringify(booking, null, 2));
    console.log('Customer Profile:', JSON.stringify(customerProfile, null, 2));
    
    // Calling the Supabase Edge Function instead of direct fetch to Resend
    // This solves the CORS issue
    const { data, error } = await supabase.functions.invoke('admin-notification', {
      body: { 
        booking, 
        customerProfile 
      }
    });

    if (error) {
      console.error('CRITICAL: Edge Function Invocation Failed!', error);
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    console.log('--- NOTIFICATION CALL SUCCESSFUL ---');
    console.log('Function Result:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed notification:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown Error',
      details: 'Function was reached but returned an error. Check if your Resend API key is valid and if the "To" email is allowed by your Resend plan.'
    };
  }
}
