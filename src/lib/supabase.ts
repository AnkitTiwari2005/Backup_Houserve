import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  throw new Error('CRITICAL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
