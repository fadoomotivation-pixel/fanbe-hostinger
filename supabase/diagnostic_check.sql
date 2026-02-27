-- ============================================================
-- DIAGNOSTIC: Check Current Database Schema
-- ============================================================
-- Run this to see what's missing in your database
-- ============================================================

-- 1. Check if tables exist
SELECT 
  tablename,
  'EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'calls', 'site_visits', 'tasks', 'bookings', 'profiles')
ORDER BY tablename;

-- 2. Check columns in leads table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 3. Check columns in calls table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calls'
ORDER BY ordinal_position;

-- 4. Check columns in site_visits table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'site_visits'
ORDER BY ordinal_position;

-- 5. Check columns in tasks table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 6. Check RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('leads', 'calls', 'site_visits', 'tasks', 'bookings')
ORDER BY tablename, policyname;

-- 7. Try a simple select to see what error occurs
SELECT COUNT(*) as lead_count FROM leads;

-- 8. Check for missing required columns that cause 400 errors
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') 
    THEN 'YES' ELSE 'NO' 
  END as has_phone_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name') 
    THEN 'YES' ELSE 'NO' 
  END as has_name_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') 
    THEN 'YES' ELSE 'NO' 
  END as has_email_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source') 
    THEN 'YES' ELSE 'NO' 
  END as has_source_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') 
    THEN 'YES' ELSE 'NO' 
  END as has_status_column;
