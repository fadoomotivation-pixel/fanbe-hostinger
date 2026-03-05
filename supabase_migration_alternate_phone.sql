-- Add alternate_phone column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS alternate_phone TEXT[];

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);

-- Update RLS policies to allow employees to update their assigned leads
CREATE POLICY "Employees can update their assigned leads"
ON leads FOR UPDATE
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

