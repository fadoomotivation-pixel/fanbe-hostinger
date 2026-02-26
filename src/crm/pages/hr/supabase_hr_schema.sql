-- ============================================================
-- HR Module — Supabase SQL Schema (Phase 1 + 2 + 3 + 4)
-- Run ENTIRE FILE in Supabase → SQL Editor
-- Safe to re-run — uses IF NOT EXISTS throughout
-- ============================================================

-- ── Phase 1: Employee Master ────────────────────────────────
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
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_employees;
CREATE POLICY "Service role full access" ON public.hr_employees
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_employees_emp_id_idx ON public.hr_employees(emp_id);
CREATE INDEX IF NOT EXISTS hr_employees_status_idx ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS hr_employees_branch_idx ON public.hr_employees(branch);

-- ── Phase 2: Attendance ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_attendance (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id        TEXT NOT NULL REFERENCES public.hr_employees(emp_id) ON DELETE CASCADE,
  att_date      DATE NOT NULL,
  status        TEXT DEFAULT 'Present' CHECK (status IN ('Present','Absent','Half Day','Leave','Holiday')),
  in_time       TIME,
  out_time      TIME,
  work_hours    NUMERIC(4,1),
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_attendance;
CREATE POLICY "Service role full access" ON public.hr_attendance
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_attendance_emp_idx  ON public.hr_attendance(emp_id);
CREATE INDEX IF NOT EXISTS hr_attendance_date_idx ON public.hr_attendance(att_date);

-- ── Phase 2: Leave Requests ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_leaves (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id        TEXT NOT NULL REFERENCES public.hr_employees(emp_id) ON DELETE CASCADE,
  leave_type    TEXT DEFAULT 'Casual Leave',
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  reason        TEXT,
  status        TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_leaves;
CREATE POLICY "Service role full access" ON public.hr_leaves
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_leaves_emp_idx    ON public.hr_leaves(emp_id);
CREATE INDEX IF NOT EXISTS hr_leaves_status_idx ON public.hr_leaves(status);

-- ── Phase 2: Holidays ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_holidays (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_name  TEXT NOT NULL,
  holiday_date  DATE NOT NULL UNIQUE,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_holidays;
CREATE POLICY "Service role full access" ON public.hr_holidays
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_holidays_date_idx ON public.hr_holidays(holiday_date);

-- ── Phase 3: Payroll ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_payroll (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id           TEXT NOT NULL REFERENCES public.hr_employees(emp_id) ON DELETE CASCADE,
  emp_name         TEXT,
  department       TEXT,
  designation      TEXT,
  month            INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INT NOT NULL,
  basic_salary     NUMERIC(12,2) DEFAULT 0,
  hra              NUMERIC(12,2) DEFAULT 0,
  conveyance       NUMERIC(12,2) DEFAULT 0,
  other_allowance  NUMERIC(12,2) DEFAULT 0,
  gross_salary     NUMERIC(12,2) DEFAULT 0,
  pf_deduction     NUMERIC(12,2) DEFAULT 0,
  tds              NUMERIC(12,2) DEFAULT 0,
  other_deduction  NUMERIC(12,2) DEFAULT 0,
  advance          NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary       NUMERIC(12,2) DEFAULT 0,
  working_days     INT DEFAULT 26,
  present_days     INT DEFAULT 26,
  payment_mode     TEXT DEFAULT 'Bank Transfer',
  payment_date     DATE,
  status           TEXT DEFAULT 'Pending' CHECK (status IN ('Paid','Pending','Hold')),
  remarks          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (emp_id, month, year)
);
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_payroll;
CREATE POLICY "Service role full access" ON public.hr_payroll
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_payroll_emp_idx    ON public.hr_payroll(emp_id);
CREATE INDEX IF NOT EXISTS hr_payroll_month_idx  ON public.hr_payroll(month, year);
CREATE INDEX IF NOT EXISTS hr_payroll_status_idx ON public.hr_payroll(status);

-- ── Phase 4: Document Vault ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_documents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id       TEXT NOT NULL REFERENCES public.hr_employees(emp_id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'Other',
  doc_name     TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  file_url     TEXT,
  file_type    TEXT,
  file_size    BIGINT,
  expiry_date  DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.hr_documents;
CREATE POLICY "Service role full access" ON public.hr_documents
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS hr_documents_emp_idx  ON public.hr_documents(emp_id);
CREATE INDEX IF NOT EXISTS hr_documents_cat_idx  ON public.hr_documents(category);

-- ============================================================
-- ✅ ALL DONE — 5 Tables created:
--   hr_employees | hr_attendance | hr_leaves
--   hr_holidays  | hr_payroll    | hr_documents
--
-- Also create Supabase Storage bucket manually:
--   Name: hr-documents
--   Public: true (or use signed URLs if private)
-- ============================================================
