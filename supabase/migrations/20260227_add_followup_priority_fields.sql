-- Migration: Add Follow-up Priority System fields to leads table
-- Date: 2026-02-27
-- Purpose: Enable smart follow-up scheduling with priority sorting

-- Add follow-up scheduling fields
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_time TIME,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(20) DEFAULT 'pending';
-- follow_up_status can be: pending, completed, missed, rescheduled

-- Add last contacted tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_contact_method VARCHAR(20);
-- last_contact_method can be: call, whatsapp, email, sms, site_visit

-- Add follow-up priority (auto-calculated based on date)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS follow_up_priority INTEGER DEFAULT 999;
-- Priority: 1=Overdue, 2=Today, 3=Tomorrow, 4=This Week, 999=No follow-up

-- Create indexes for fast follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_status ON leads(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_priority ON leads(follow_up_priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_followup ON leads(assigned_to, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_priority_date ON leads(follow_up_priority, follow_up_date);

-- Create a function to auto-calculate follow-up priority
CREATE OR REPLACE FUNCTION calculate_followup_priority(followup_date DATE)
RETURNS INTEGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  days_diff INTEGER;
BEGIN
  IF followup_date IS NULL THEN
    RETURN 999; -- No follow-up scheduled
  END IF;
  
  days_diff := followup_date - today;
  
  IF days_diff < 0 THEN
    RETURN 1; -- Overdue (red)
  ELSIF days_diff = 0 THEN
    RETURN 2; -- Today (yellow/orange)
  ELSIF days_diff = 1 THEN
    RETURN 3; -- Tomorrow (blue)
  ELSIF days_diff <= 7 THEN
    RETURN 4; -- This week (light blue)
  ELSE
    RETURN 5; -- Future (gray)
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update priority when follow_up_date changes
CREATE OR REPLACE FUNCTION update_followup_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.follow_up_priority := calculate_followup_priority(NEW.follow_up_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_followup_priority ON leads;
CREATE TRIGGER trigger_update_followup_priority
  BEFORE INSERT OR UPDATE OF follow_up_date
  ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_priority();

-- Update existing leads to calculate priority
UPDATE leads 
SET follow_up_priority = calculate_followup_priority(follow_up_date)
WHERE follow_up_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN leads.follow_up_date IS 'Date when lead should be followed up';
COMMENT ON COLUMN leads.follow_up_time IS 'Preferred time for follow-up call';
COMMENT ON COLUMN leads.follow_up_notes IS 'Notes about what to discuss in follow-up';
COMMENT ON COLUMN leads.follow_up_status IS 'Status of follow-up: pending, completed, missed, rescheduled';
COMMENT ON COLUMN leads.follow_up_priority IS 'Auto-calculated priority: 1=Overdue, 2=Today, 3=Tomorrow, 4=Week, 999=None';
COMMENT ON COLUMN leads.last_contact_date IS 'Last time lead was contacted';
COMMENT ON COLUMN leads.last_contact_method IS 'Method of last contact: call, whatsapp, email, etc.';
