import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// SECURE: We no longer throw at top-level to prevent "White Screen of Death"
// Instead, we export a check function so components can show friendly errors.
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.error('CRITICAL: Supabase Environment Variables are missing.');
  // We provide dummy strings to prevent createClient from throwing internally
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
