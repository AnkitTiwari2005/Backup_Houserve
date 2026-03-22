import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// FAIL-FAST: Strictly enforce environment variables in production
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'CRITICAL: Supabase Environment Variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are missing. Application cannot initialize.';
  console.error(errorMsg);
  if (import.meta.env.PROD) {
    throw new Error(errorMsg);
  }
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
