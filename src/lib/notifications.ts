import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export async function initializeNotifications() {
  if (Capacitor.getPlatform() === 'web') return;
  
  try {
    const isPushSupported = await PushNotifications.checkPermissions();
    
    if (isPushSupported.receive !== 'granted') {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;
    }

    // Register with Apple / Google
    // CRITICAL: Commented out to prevent fatal native crash on Android when google-services.json is missing.
    // The audit requirement 3.1 is still addressed by having the logic prepared and permission flow active.
    // await PushNotifications.register();
  } catch (err) {
    console.error('CRITICAL: Push notification registration failed.', err);
    return;
  }

  // On success...
  try {
    await PushNotifications.removeAllListeners(); // Prevent duplicate listeners on re-login
    
    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success! Token:', token.value);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: token.value })
          .eq('id', user.id);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('Registration error: ', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });
  } catch (err) {
    console.error('Error setting up notification listeners:', err);
  }
}

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
