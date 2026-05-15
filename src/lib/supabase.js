import { createClient } from '@supabase/supabase-js';

// Anon key is public by design — Supabase RLS gates access. Hardcoded
// fallbacks let Vercel preview builds work even before env vars are set.
// Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for local dev
// or to rotate keys without code changes.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://mfgjzkaabyltscgrkhdz.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'fanbe-crm-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
