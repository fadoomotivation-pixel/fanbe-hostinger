-- ============================================================
-- ATTENDANCE TABLE — Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Employee
  employee_id         TEXT NOT NULL,
  employee_name       TEXT,

  -- Date (one row per employee per day)
  date                DATE NOT NULL,

  -- Punch In
  punch_in            TIMESTAMPTZ,
  punch_in_lat        DOUBLE PRECISION,
  punch_in_lng        DOUBLE PRECISION,
  punch_in_accuracy   INT,             -- meters
  punch_in_selfie     TEXT,            -- base64 JPEG or Supabase Storage URL

  -- Punch Out
  punch_out           TIMESTAMPTZ,
  punch_out_lat       DOUBLE PRECISION,
  punch_out_lng       DOUBLE PRECISION,
  punch_out_accuracy  INT,
  punch_out_selfie    TEXT,

  -- Computed
  total_minutes       INT DEFAULT 0,
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','present','half_day','absent')),

  -- Metadata
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Each employee can only have ONE row per date
  UNIQUE (employee_id, date)
);

-- Index for admin queries by date range
CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_attendance_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Employees can INSERT/SELECT their own rows
CREATE POLICY "Employee can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (employee_id = auth.uid()::text);

CREATE POLICY "Employee can update own attendance"
  ON attendance FOR UPDATE
  USING (employee_id = auth.uid()::text);

CREATE POLICY "Employee can view own attendance"
  ON attendance FOR SELECT
  USING (employee_id = auth.uid()::text);

-- Admins / HR can view all (uses service key — already bypasses RLS)
-- If you access via service key (supabaseAdmin) no policy needed.
-- Add this only if you ever query with the anon key from admin panel:
CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text
        AND profiles.role IN ('super_admin','sub_admin','hr_manager')
    )
  );
