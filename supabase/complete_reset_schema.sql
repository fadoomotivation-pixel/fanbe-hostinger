-- ============================================================
-- FANBE CRM - COMPLETE SCHEMA RESET
-- ============================================================
-- WARNING: This will DROP existing tables and recreate them
-- Only run this if you want to start fresh
-- ============================================================

-- DROP existing tables (if you want clean start)
-- UNCOMMENT the lines below ONLY if you want to delete all data and start fresh
/*
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS site_visits CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
*/

-- ============================================================
-- CREATE TABLES FROM SCRATCH
-- ============================================================

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'Website',
  status TEXT DEFAULT 'new',
  interest_level TEXT DEFAULT 'warm',
  project_name TEXT,
  budget TEXT,
  assigned_to UUID,
  assigned_to_name TEXT,
  assignment_date TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  created_by UUID,
  last_contact_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  conversion_probability INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_phone_key'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_phone_key UNIQUE (phone);
  END IF;
END $$;

-- 2. CALLS TABLE
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  lead_id UUID,
  lead_name TEXT NOT NULL,
  phone TEXT,
  project_name TEXT,
  call_type TEXT DEFAULT 'outbound',
  status TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  notes TEXT,
  feedback TEXT,
  next_followup_date DATE,
  call_date DATE DEFAULT CURRENT_DATE,
  call_time TIME DEFAULT CURRENT_TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SITE_VISITS TABLE
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  lead_id UUID,
  lead_name TEXT NOT NULL,
  phone TEXT,
  project_name TEXT,
  visit_date DATE NOT NULL,
  visit_time TIME,
  status TEXT DEFAULT 'scheduled',
  location TEXT,
  duration INTEGER DEFAULT 60,
  notes TEXT,
  feedback TEXT,
  interest_level TEXT,
  next_followup_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  assigned_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'call',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  related_lead_id UUID,
  related_call_id UUID,
  related_site_visit_id UUID,
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  employee_id UUID,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  project_name TEXT NOT NULL,
  plot_number TEXT,
  plot_size TEXT,
  plot_facing TEXT,
  total_amount NUMERIC(12, 2),
  booking_amount NUMERIC(12, 2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  booking_date DATE DEFAULT CURRENT_DATE,
  registration_date DATE,
  possession_date DATE,
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- ============================================================
-- CREATE INDEXES
-- ============================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_employee_id ON calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Site visits indexes
CREATE INDEX IF NOT EXISTS idx_site_visits_employee_id ON site_visits(employee_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead_id ON tasks(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date DESC);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE RLS POLICIES (ALLOW ALL FOR NOW)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
DROP POLICY IF EXISTS "Allow all operations on calls" ON calls;
DROP POLICY IF EXISTS "Allow all operations on site_visits" ON site_visits;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on bookings" ON bookings;

-- Create permissive policies
CREATE POLICY "Allow all operations on leads"
  ON leads
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on calls"
  ON calls
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on site_visits"
  ON site_visits
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks"
  ON tasks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on bookings"
  ON bookings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Leads trigger
DROP TRIGGER IF EXISTS set_leads_updated_at ON leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Site visits trigger
DROP TRIGGER IF EXISTS set_site_visits_updated_at ON site_visits;
CREATE TRIGGER set_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tasks trigger
DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Bookings trigger
DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 
  'Setup complete!' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('leads', 'calls', 'site_visits', 'tasks', 'bookings')
  ) as tables_created,
  (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE tablename IN ('leads', 'calls', 'site_visits', 'tasks', 'bookings')
  ) as policies_created;
