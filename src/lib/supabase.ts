/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const FALLBACK_URL = 'https://mfgjzkaabyltscgrkhdz.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ2p6a2FhYnlsdHNjZ3JraGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzNjQsImV4cCI6MjA4NjkxNjM2NH0.V6uWBH72rgp0UEFdB9aT8qrG4YFYhnERWZO1t976_tM'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const SUPABASE_URL = (typeof envUrl === 'string' && envUrl.startsWith('https://')) ? envUrl : FALLBACK_URL
const SUPABASE_KEY = (typeof envKey === 'string' && envKey.length > 50) ? envKey : FALLBACK_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
