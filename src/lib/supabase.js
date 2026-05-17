// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Hardcoded constants for URL + anon key are SAFE: both are public values
// (the anon key is specifically designed to ship in the client bundle and
// is enforced by RLS server-side). They serve as a fallback whenever the
// Vite-injected env vars are missing, empty, or malformed — that has
// historically caused opaque "fetch Invalid value" errors at runtime
// because the Supabase SDK builds Bearer headers from whatever string
// it gets, and HTTP Headers reject whitespace/newlines.
//
// Service role key (admin client) is NEVER hardcoded — it stays env-only.
const HARDCODED_URL      = 'https://mfgjzkaabyltscgrkhdz.supabase.co';
const HARDCODED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM';

// Trim guards against a pasted-with-whitespace env value.
const cleanEnv = (v) => (typeof v === 'string' ? v.trim() : '');
// JWT format check: 3 base64url segments separated by `.`
const isValidJwt = (k) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(k);
// URL format check: must be https://*.supabase.co (no spaces, no newlines)
const isValidUrl = (u) => /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(u);

const envUrl     = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const envAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const envSrvKey  = cleanEnv(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const supabaseUrl            = isValidUrl(envUrl) ? envUrl : HARDCODED_URL;
const supabaseAnonKey        = isValidJwt(envAnonKey) ? envAnonKey : HARDCODED_ANON_KEY;
const supabaseServiceRoleKey = isValidJwt(envSrvKey) ? envSrvKey : supabaseAnonKey;

if (envUrl && !isValidUrl(envUrl)) {
  console.warn('[Supabase] VITE_SUPABASE_URL malformed; using hardcoded fallback.');
}
if (envAnonKey && !isValidJwt(envAnonKey)) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY malformed; using hardcoded fallback.');
}
if (envSrvKey && !isValidJwt(envSrvKey)) {
  console.warn(
    '[Supabase] VITE_SUPABASE_SERVICE_ROLE_KEY malformed; admin client will use anon key. ' +
    'Re-paste the value in Vercel (check for leading/trailing whitespace or newline).'
  );
} else if (!envSrvKey) {
  console.warn('[Supabase] VITE_SUPABASE_SERVICE_ROLE_KEY not set; admin client using anon key.');
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
