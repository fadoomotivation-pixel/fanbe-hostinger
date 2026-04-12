// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ⚠️  NEVER hardcode keys here.
// Set these in Hostinger → Advanced → Environment Variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//   VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl            = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey        = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);

if (!hasSupabaseEnv) {
  console.error(
    '[Supabase] Missing environment variables. ' +
    'Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ' +
    'VITE_SUPABASE_SERVICE_ROLE_KEY in Hostinger env settings.'
  );
}

console.log('[Supabase] Using URL:', supabaseUrl);

// Prevent hard crash (`supabaseUrl is required`) when env vars are missing.
// These fallbacks keep the app booting and surface clear runtime errors instead.
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeAnonKey = supabaseAnonKey || 'missing-anon-key';
const safeServiceRoleKey = supabaseServiceRoleKey || 'missing-service-role-key';

// Singleton pattern - prevents multiple GoTrueClient instances warning
let _supabase      = null;
let _supabaseAdmin = null;

const getSupabaseClient = () => {
  if (!_supabase) {
    _supabase = createClient(safeSupabaseUrl, safeAnonKey, {
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
    _supabaseAdmin = createClient(safeSupabaseUrl, safeServiceRoleKey, {
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
