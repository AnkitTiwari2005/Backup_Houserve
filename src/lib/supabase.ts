import { createClient } from '@supabase/supabase-js';

// Get SUPABASE credentials from env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wwnbbjvxrhjjwfshtxto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bmJianZ4cmhqandmc2h0eHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODIwMjgsImV4cCI6MjA4ODg1ODAyOH0.43vGCUfAos1xPr0fIvDEy2mzO1ajjof42FJC1ryrq9w';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('VITE_SUPABASE_URL is missing, using fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
