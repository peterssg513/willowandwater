import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a placeholder client if credentials are missing
// This allows the site to load without Supabase configured
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
  );
  // Create a mock client that won't crash the app
  supabase = {
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    }),
  };
}

export { supabase };
