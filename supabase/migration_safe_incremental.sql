-- ============================================================
-- FANBE CRM - SAFE INCREMENTAL MIGRATION
-- ============================================================
-- Creates missing tables, then adds missing columns
-- Safe to run multiple times
-- ============================================================

-- ============================================================
-- STEP 1: CREATE MISSING TABLES (IF NOT EXIST)
-- ============================================================

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  employee_id UUID,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  project_name TEXT NOT NULL,
  total_amount NUMERIC(12, 2),
  booking_amount NUMERIC(12, 2),
  status TEXT DEFAULT 'pending',
  booking_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add columns to LEADS table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='interest_level') THEN
    ALTER TABLE leads ADD COLUMN interest_level TEXT DEFAULT 'warm';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='project_name') THEN
    ALTER TABLE leads ADD COLUMN project_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='budget') THEN
    ALTER TABLE leads ADD COLUMN budget TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='assigned_to_name') THEN
    ALTER TABLE leads ADD COLUMN assigned_to_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='assignment_date') THEN
    ALTER TABLE leads ADD COLUMN assignment_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='is_vip') THEN
    ALTER TABLE leads ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='is_active') THEN
    ALTER TABLE leads ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='is_archived') THEN
    ALTER TABLE leads ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='next_followup_date') THEN
    ALTER TABLE leads ADD COLUMN next_followup_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='tags') THEN
    ALTER TABLE leads ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- Add columns to CALLS table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='call_date') THEN
    ALTER TABLE calls ADD COLUMN call_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='call_time') THEN
    ALTER TABLE calls ADD COLUMN call_time TIME DEFAULT CURRENT_TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='lead_name') THEN
    ALTER TABLE calls ADD COLUMN lead_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='phone') THEN
    ALTER TABLE calls ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='project_name') THEN
    ALTER TABLE calls ADD COLUMN project_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='call_type') THEN
    ALTER TABLE calls ADD COLUMN call_type TEXT DEFAULT 'outbound';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='feedback') THEN
    ALTER TABLE calls ADD COLUMN feedback TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='next_followup_date') THEN
    ALTER TABLE calls ADD COLUMN next_followup_date DATE;
  END IF;
END $$;

-- Add columns to SITE_VISITS table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='lead_name') THEN
    ALTER TABLE site_visits ADD COLUMN lead_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='phone') THEN
    ALTER TABLE site_visits ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='project_name') THEN
    ALTER TABLE site_visits ADD COLUMN project_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='feedback') THEN
    ALTER TABLE site_visits ADD COLUMN feedback TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='interest_level') THEN
    ALTER TABLE site_visits ADD COLUMN interest_level TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='next_followup_date') THEN
    ALTER TABLE site_visits ADD COLUMN next_followup_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='visit_time') THEN
    ALTER TABLE site_visits ADD COLUMN visit_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='location') THEN
    ALTER TABLE site_visits ADD COLUMN location TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='duration') THEN
    ALTER TABLE site_visits ADD COLUMN duration INTEGER DEFAULT 60;
  END IF;
END $$;

-- Add columns to TASKS table (now it exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigned_by') THEN
    ALTER TABLE tasks ADD COLUMN assigned_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='type') THEN
    ALTER TABLE tasks ADD COLUMN type TEXT DEFAULT 'call';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority') THEN
    ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='related_lead_id') THEN
    ALTER TABLE tasks ADD COLUMN related_lead_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='related_call_id') THEN
    ALTER TABLE tasks ADD COLUMN related_call_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='related_site_visit_id') THEN
    ALTER TABLE tasks ADD COLUMN related_site_visit_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_time') THEN
    ALTER TABLE tasks ADD COLUMN due_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completed_at') THEN
    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completion_notes') THEN
    ALTER TABLE tasks ADD COLUMN completion_notes TEXT;
  END IF;
END $$;

-- ============================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_employee_id ON calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Site visits indexes
CREATE INDEX IF NOT EXISTS idx_site_visits_employee_id ON site_visits(employee_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead_id ON tasks(related_lead_id);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date DESC);

-- ============================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY & CREATE POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to leads" ON leads;
DROP POLICY IF EXISTS "Allow all access to calls" ON calls;
DROP POLICY IF EXISTS "Allow all access to site_visits" ON site_visits;
DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all access to bookings" ON bookings;

-- Create permissive policies (allows all operations)
CREATE POLICY "Allow all access to leads"
  ON leads FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to calls"
  ON calls FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to site_visits"
  ON site_visits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to tasks"
  ON tasks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to bookings"
  ON bookings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 5: CREATE UPDATE TRIGGERS
-- ============================================================

-- Function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leads
DROP TRIGGER IF EXISTS set_leads_updated_at ON leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to site_visits
DROP TRIGGER IF EXISTS set_site_visits_updated_at ON site_visits;
CREATE TRIGGER set_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to tasks
DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to bookings
DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================

SELECT 
  'Migration completed successfully!' AS status,
  (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('leads', 'calls', 'site_visits', 'tasks', 'bookings')
  ) AS tables_ready;
