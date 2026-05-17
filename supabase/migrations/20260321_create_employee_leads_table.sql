-- ============================================================
-- EMPLOYEE LEADS TABLE
-- Separate table for leads submitted by employees (sales_executive, telecaller)
-- This does NOT affect the existing leads table or admin functionality
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitted by
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_by_name TEXT NOT NULL,

  -- Customer Basic Info
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  alternate_phone TEXT,

  -- Customer Details
  occupation TEXT,
  city TEXT,
  locality TEXT,
  pincode TEXT,

  -- Lead Details
  source TEXT DEFAULT 'Employee Referral',
  interest_level TEXT DEFAULT 'warm',  -- hot, warm, cold
  project_interested TEXT,
  budget_range TEXT,
  property_type TEXT,                  -- plot, flat, villa, commercial, other
  preferred_size TEXT,

  -- Requirements
  purpose TEXT,                        -- investment, self_use, both
  possession_timeline TEXT,            -- immediate, 3_months, 6_months, 1_year, flexible
  financing TEXT,                      -- cash, loan, both

  -- Conversation Summary
  how_they_know TEXT,                  -- how the customer came to know
  customer_remarks TEXT,               -- what the customer said
  employee_remarks TEXT,               -- employee's own assessment
  site_visit_interest BOOLEAN DEFAULT FALSE,
  preferred_visit_date DATE,

  -- Admin Review
  admin_status TEXT DEFAULT 'pending', -- pending, approved, rejected, converted
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  converted_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_leads_submitted_by ON employee_leads(submitted_by);
CREATE INDEX IF NOT EXISTS idx_employee_leads_admin_status ON employee_leads(admin_status);
CREATE INDEX IF NOT EXISTS idx_employee_leads_created_at ON employee_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_leads_phone ON employee_leads(phone);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_leads_updated_at ON employee_leads;
CREATE TRIGGER set_employee_leads_updated_at
  BEFORE UPDATE ON employee_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_leads_updated_at();

-- RLS
ALTER TABLE employee_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to employee_leads" ON employee_leads;
CREATE POLICY "Allow service role full access to employee_leads"
  ON employee_leads FOR ALL
  USING (true)
  WITH CHECK (true);
