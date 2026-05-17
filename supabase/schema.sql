-- ============================================================
-- FANBE GROUP CRM - SUPABASE DATABASE SCHEMA
-- ============================================================
-- This schema creates all necessary tables for the CRM system
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================

-- ============================================================
-- 1. LEADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  
  -- Lead Details
  source TEXT DEFAULT 'Website',
  status TEXT DEFAULT 'new',
  interest_level TEXT DEFAULT 'warm', -- hot, warm, cold
  
  -- Project & Budget
  project_name TEXT,
  budget TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assignment_date TIMESTAMPTZ,
  
  -- Additional Info
  notes TEXT,
  tags TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Tracking
  last_contact_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  conversion_probability INTEGER DEFAULT 0,
  
  -- Flags
  is_vip BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leads_updated_at ON leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- ============================================================
-- 2. CALLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Call Details
  lead_name TEXT NOT NULL,
  phone TEXT,
  project_name TEXT,
  
  call_type TEXT DEFAULT 'outbound', -- outbound, inbound, followup
  status TEXT NOT NULL, -- connected, not_answered, busy, switched_off, invalid_number, call_back_requested
  
  duration INTEGER DEFAULT 0, -- in seconds
  notes TEXT,
  feedback TEXT,
  
  -- Follow-up
  next_followup_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  call_date DATE DEFAULT CURRENT_DATE,
  call_time TIME DEFAULT CURRENT_TIME
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_employee_id ON calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- ============================================================
-- 3. SITE VISITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Visit Details
  lead_name TEXT NOT NULL,
  phone TEXT,
  project_name TEXT,
  
  visit_date DATE NOT NULL,
  visit_time TIME,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled, no_show
  
  location TEXT,
  duration INTEGER DEFAULT 60, -- in minutes
  
  -- Feedback
  notes TEXT,
  feedback TEXT,
  interest_level TEXT, -- hot, warm, cold
  
  -- Follow-up
  next_followup_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_visits_employee_id ON site_visits(employee_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_site_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_site_visits_updated_at ON site_visits;
CREATE TRIGGER set_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_site_visits_updated_at();

-- ============================================================
-- 4. TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Task Details
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'call', -- call, site_visit, email, followup, other
  priority TEXT DEFAULT 'medium', -- high, medium, low
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  
  -- Relationships
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  related_site_visit_id UUID REFERENCES site_visits(id) ON DELETE SET NULL,
  
  -- Schedule
  due_date DATE,
  due_time TIME,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead_id ON tasks(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ============================================================
-- 5. BOOKINGS TABLE (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Customer Details
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Booking Details
  project_name TEXT NOT NULL,
  plot_number TEXT,
  plot_size TEXT,
  plot_facing TEXT,
  
  -- Financial
  total_amount NUMERIC(12, 2),
  booking_amount NUMERIC(12, 2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  
  -- Dates
  booking_date DATE DEFAULT CURRENT_DATE,
  registration_date DATE,
  possession_date DATE,
  
  -- Additional Info
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role full access to leads" ON leads;
DROP POLICY IF EXISTS "Allow service role full access to calls" ON calls;
DROP POLICY IF EXISTS "Allow service role full access to site_visits" ON site_visits;
DROP POLICY IF EXISTS "Allow service role full access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow service role full access to bookings" ON bookings;

-- Service role has full access (bypasses RLS anyway, but explicit policy for clarity)
CREATE POLICY "Allow service role full access to leads"
  ON leads FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to calls"
  ON calls FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to site_visits"
  ON site_visits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to tasks"
  ON tasks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to bookings"
  ON bookings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. UTILITY FUNCTIONS
-- ============================================================

-- Function to get lead statistics
CREATE OR REPLACE FUNCTION get_lead_statistics()
RETURNS TABLE (
  total_leads BIGINT,
  unassigned_leads BIGINT,
  assigned_leads BIGINT,
  hot_leads BIGINT,
  warm_leads BIGINT,
  cold_leads BIGINT,
  today_leads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_leads,
    COUNT(*) FILTER (WHERE assigned_to IS NULL)::BIGINT AS unassigned_leads,
    COUNT(*) FILTER (WHERE assigned_to IS NOT NULL)::BIGINT AS assigned_leads,
    COUNT(*) FILTER (WHERE interest_level = 'hot')::BIGINT AS hot_leads,
    COUNT(*) FILTER (WHERE interest_level = 'warm')::BIGINT AS warm_leads,
    COUNT(*) FILTER (WHERE interest_level = 'cold')::BIGINT AS cold_leads,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT AS today_leads
  FROM leads
  WHERE is_active = true AND is_archived = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee performance
CREATE OR REPLACE FUNCTION get_employee_performance(
  emp_id UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_calls BIGINT,
  connected_calls BIGINT,
  total_site_visits BIGINT,
  completed_site_visits BIGINT,
  total_bookings BIGINT,
  leads_assigned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM calls WHERE employee_id = emp_id AND call_date BETWEEN start_date AND end_date)::BIGINT,
    (SELECT COUNT(*) FROM calls WHERE employee_id = emp_id AND status = 'connected' AND call_date BETWEEN start_date AND end_date)::BIGINT,
    (SELECT COUNT(*) FROM site_visits WHERE employee_id = emp_id AND visit_date BETWEEN start_date AND end_date)::BIGINT,
    (SELECT COUNT(*) FROM site_visits WHERE employee_id = emp_id AND status = 'completed' AND visit_date BETWEEN start_date AND end_date)::BIGINT,
    (SELECT COUNT(*) FROM bookings WHERE employee_id = emp_id AND booking_date BETWEEN start_date AND end_date)::BIGINT,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = emp_id AND DATE(assignment_date) BETWEEN start_date AND end_date)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- ============================================================

-- Uncomment below to insert sample leads for testing
/*
INSERT INTO leads (name, phone, email, source, status, interest_level, project_name, budget, notes)
VALUES
  ('Rajesh Kumar', '+919876543210', 'rajesh@example.com', 'Website', 'new', 'hot', 'Maa Simri Vatika', '₹10-15 लाख', 'Very interested, call back tomorrow'),
  ('Priya Sharma', '+919876543211', 'priya@example.com', 'Facebook', 'follow_up', 'warm', 'Brij Vatika', '₹5-8 लाख', 'Needs more details'),
  ('Amit Singh', '+919876543212', NULL, 'Reference', 'new', 'cold', 'Shree Gokul Vatika', '₹3-5 लाख', 'Budget limited'),
  ('Sunita Devi', '+919876543213', 'sunita@example.com', 'Walk-in', 'new', 'hot', 'Shree Kunj Bihari Enclave', '₹15-20 लाख', 'Ready to book, schedule site visit'),
  ('Vikram Yadav', '+919876543214', NULL, '99acres', 'follow_up', 'warm', 'Maa Simri Vatika', '₹8-12 लाख', 'Interested in plot near main road');
*/

-- ============================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables created: Go to Table Editor
-- 3. Test import: Upload sample CSV at /crm/admin/import-leads
-- 4. Check data: Query leads table
-- ============================================================
