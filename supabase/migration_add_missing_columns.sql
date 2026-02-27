-- ============================================================
-- FANBE GROUP CRM - DATABASE MIGRATION
-- ============================================================
-- This migration adds missing columns to existing tables
-- Safe to run multiple times (uses IF NOT EXISTS checks)
-- ============================================================

-- ============================================================
-- 1. UPDATE LEADS TABLE
-- ============================================================

-- Add missing columns to leads table if they don't exist
DO $$ 
BEGIN
  -- Check and add columns one by one
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
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='tags') THEN
    ALTER TABLE leads ADD COLUMN tags TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='created_by') THEN
    ALTER TABLE leads ADD COLUMN created_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='last_contact_date') THEN
    ALTER TABLE leads ADD COLUMN last_contact_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='next_followup_date') THEN
    ALTER TABLE leads ADD COLUMN next_followup_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='conversion_probability') THEN
    ALTER TABLE leads ADD COLUMN conversion_probability INTEGER DEFAULT 0;
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
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);

-- ============================================================
-- 2. UPDATE CALLS TABLE
-- ============================================================

DO $$ 
BEGIN
  -- Add missing columns to calls table
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
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='call_date') THEN
    ALTER TABLE calls ADD COLUMN call_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='call_time') THEN
    ALTER TABLE calls ADD COLUMN call_time TIME DEFAULT CURRENT_TIME;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_calls_employee_id ON calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- ============================================================
-- 3. UPDATE SITE_VISITS TABLE
-- ============================================================

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
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='visit_time') THEN
    ALTER TABLE site_visits ADD COLUMN visit_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='location') THEN
    ALTER TABLE site_visits ADD COLUMN location TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='duration') THEN
    ALTER TABLE site_visits ADD COLUMN duration INTEGER DEFAULT 60;
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
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_visits' AND column_name='completed_at') THEN
    ALTER TABLE site_visits ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_site_visits_employee_id ON site_visits(employee_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);

-- ============================================================
-- 4. UPDATE TASKS TABLE
-- ============================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead_id ON tasks(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY & POLICIES
-- ============================================================

-- Enable RLS (if not already enabled)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Allow all access to leads" ON leads;
DROP POLICY IF EXISTS "Allow all access to calls" ON calls;
DROP POLICY IF EXISTS "Allow all access to site_visits" ON site_visits;
DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;

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

-- ============================================================
-- 6. UPDATE TRIGGERS
-- ============================================================

-- Updated_at trigger for leads
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

-- Updated_at trigger for site_visits
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

-- Updated_at trigger for tasks
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
-- MIGRATION COMPLETE
-- ============================================================
-- All missing columns have been added
-- Indexes created for performance
-- RLS policies configured
-- Triggers set up for automatic timestamps
-- ============================================================

SELECT 'Migration completed successfully!' AS status;
