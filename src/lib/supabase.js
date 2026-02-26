// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Read from environment variable - allows Cloudflare proxy via api.fanbegroup.com
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mfgjzkaabyltscgrkhdz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM';
const supabaseServiceRoleKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM0MDM2NCwiZXhwIjoyMDg2OTE2MzY0fQ.WaQ9h3ea_5KiLQfTZH8EmHhl4OJJ_lT1oM-PzvW1dMI';

console.log('[Supabase] Using URL:', supabaseUrl);

// Primary Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using service_role key — bypasses RLS and can call auth.admin.* APIs.
// Never auto-signs-in or persists a session, so the logged-in admin session is unaffected.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
