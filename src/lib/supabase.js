// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfgjzkaabyltscgrkhdz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM';

// Primary Supabase client (admin session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Secondary Supabase client for creating new users without disrupting admin session.
// createUserWithSignUp auto-signs-in the new user, so we use a separate client
// with its own isolated storage to keep the admin's auth session intact.
export const supabaseSecondary = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase_secondary_auth',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
