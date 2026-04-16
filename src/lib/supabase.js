// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Set these in Hostinger → Advanced → Environment Variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//   VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl            = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey        = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Set them in Hostinger env settings.'
  );
}

if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[Supabase] WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'Falling back to anon key for admin client — some admin operations may be restricted by RLS.'
  );
}

console.log('[Supabase] URL:', supabaseUrl);

// Singleton pattern — prevents multiple GoTrueClient instances warning
let _supabase      = null;
let _supabaseAdmin = null;

const getSupabaseClient = () => {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey:         'sb-fanbe-auth-token',
        autoRefreshToken:   true,
        persistSession:     true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
};

const getSupabaseAdminClient = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        storageKey:         'sb-fanbe-admin-token',
        autoRefreshToken:   false,
        persistSession:     false,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabaseAdmin;
};

// Primary client (anon key — respects RLS)
export const supabase      = getSupabaseClient();

// Admin client (service_role — bypasses RLS, admin ops only)
export const supabaseAdmin = getSupabaseAdminClient();

export default supabase;
