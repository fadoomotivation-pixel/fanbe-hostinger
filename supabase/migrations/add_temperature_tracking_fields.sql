-- Add temperature override tracking fields to leads table
-- Run this migration in Supabase SQL Editor

-- Add new columns for temperature tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS temperature_overridden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temperature_auto_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS temperature_override_reason TEXT,
ADD COLUMN IF NOT EXISTS temperature_last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for better query performance on temperature fields
CREATE INDEX IF NOT EXISTS idx_leads_temperature_override 
ON leads(temperature_overridden, temperature_auto_score);

-- Add index for finding leads with manual overrides
CREATE INDEX IF NOT EXISTS idx_leads_manual_temperature
ON leads(temperature_overridden)
WHERE temperature_overridden = TRUE;

-- Add comment to document the fields
COMMENT ON COLUMN leads.temperature_overridden IS 'True if employee manually overrode auto-calculated temperature';
COMMENT ON COLUMN leads.temperature_auto_score IS 'Automatic score (0-100) calculated by scoring engine';
COMMENT ON COLUMN leads.temperature_override_reason IS 'Employee explanation for manual temperature override';
COMMENT ON COLUMN leads.temperature_last_calculated_at IS 'Timestamp of last automatic temperature calculation';
