import { createClient } from '@supabase/supabase-js'

// Credentials are hardcoded — same Supabase project as the admin CRM.
// Env vars are NOT used: a stale/wrong VITE_SUPABASE_URL in Vercel caused
// `fetch()` to throw "Invalid value" before any network request was made.
const SUPABASE_URL = 'https://mfgjzkaabyltscgrkhdz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM'

console.log('[Sales CRM] Supabase:', SUPABASE_URL)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
