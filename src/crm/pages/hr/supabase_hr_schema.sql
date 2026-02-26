-- ============================================================
-- HR Module — Supabase SQL Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. HR Employees Master Table
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id        TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  father_name   TEXT,
  dob           DATE,
  mobile        TEXT,
  email         TEXT,
  aadhar_no     TEXT,
  pan_no        TEXT,
  address       TEXT,
  branch        TEXT,
  department    TEXT,
  designation   TEXT,
  salary        NUMERIC(12,2) DEFAULT 0,
  doj           DATE,
  bank_name     TEXT,
  account_no    TEXT,
  ifsc          TEXT,
  status        TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS — allow service_role full access (admin panel uses supabaseAdmin)
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.hr_employees
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Index for fast search
CREATE INDEX IF NOT EXISTS hr_employees_emp_id_idx   ON public.hr_employees(emp_id);
CREATE INDEX IF NOT EXISTS hr_employees_status_idx   ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS hr_employees_branch_idx   ON public.hr_employees(branch);

-- ============================================================
-- DONE — After running this, go to
-- fanbegroup.com/crm/admin/hr/employees
-- ============================================================
