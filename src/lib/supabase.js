// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Env vars must be set in Vercel → Settings → Environment Variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//   VITE_SUPABASE_SERVICE_ROLE_KEY  (optional — admin-only ops)
//
// `.trim()` guards against a pasted-with-whitespace value: when env vars
// have stray newlines/tabs, fetch() in the SDK throws "Invalid value"
// trying to use them as a Bearer header — extremely opaque error.
const cleanEnv = (v) => (typeof v === 'string' ? v.trim() : '');

const supabaseUrl            = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey        = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const rawServiceRoleKey      = cleanEnv(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
// JWT keys are always 3 base64-url segments separated by '.' — reject
// anything else (empty, "undefined" string, partially-pasted, etc.)
// and fall back to the anon key so the app still boots.
const isValidJwt = (k) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(k);
const supabaseServiceRoleKey = isValidJwt(rawServiceRoleKey) ? rawServiceRoleKey : supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in build env.'
  );
}

if (rawServiceRoleKey && !isValidJwt(rawServiceRoleKey)) {
  console.warn(
    '[Supabase] WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY is set but does not look like a JWT. ' +
    'Falling back to anon key. Check Vercel env var for stray whitespace or wrong value.'
  );
} else if (!rawServiceRoleKey) {
  console.warn(
    '[Supabase] WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'Falling back to anon key for admin client — some admin ops will be RLS-restricted.'
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
