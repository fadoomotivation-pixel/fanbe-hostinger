-- =====================================================
-- SUPABASE SETUP FOR PROJECT DOCUMENTS
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. CREATE TABLE FOR DOCUMENT METADATA
CREATE TABLE IF NOT EXISTS project_documents (
  id BIGSERIAL PRIMARY KEY,
  project_slug TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('brochure', 'map')),
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one document of each type per project
  UNIQUE(project_slug, doc_type)
);

-- 2. ADD INDEXES FOR FASTER QUERIES
CREATE INDEX IF NOT EXISTS idx_project_documents_slug 
  ON project_documents(project_slug);

CREATE INDEX IF NOT EXISTS idx_project_documents_type 
  ON project_documents(doc_type);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES

-- Allow public read access (so website can display documents)
CREATE POLICY "Allow public read access" 
  ON project_documents
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users (CRM admins) to insert/update/delete
CREATE POLICY "Allow authenticated users full access" 
  ON project_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. CREATE STORAGE BUCKET
-- Note: Run this as a separate command or in Supabase Dashboard > Storage
-- Storage > Create Bucket
-- Name: documents
-- Public: true (so URLs are accessible)

-- Grant public access to storage bucket
-- This needs to be done in Supabase Dashboard:
-- Storage > documents > Settings > Make Public

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if table exists
SELECT * FROM project_documents LIMIT 1;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'project_documents';

-- =====================================================
-- STORAGE BUCKET SETUP (Manual Steps)
-- =====================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: documents
-- 4. Public: ON (check the box)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/png
-- 7. Click "Create Bucket"
-- =====================================================

-- =====================================================
-- STORAGE POLICIES (Optional - if bucket is private)
-- =====================================================
-- If you made the bucket private, add these policies:

-- Allow public to read files
-- CREATE POLICY "Allow public downloads"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'documents');

-- Allow authenticated users to upload
-- CREATE POLICY "Allow authenticated uploads"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update
-- CREATE POLICY "Allow authenticated updates"
--   ON storage.objects FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'documents');

-- Allow authenticated users to delete
-- CREATE POLICY "Allow authenticated deletes"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'documents');
