-- =====================================================
-- SUPABASE STORAGE POLICIES FOR DOCUMENTS BUCKET
-- =====================================================
-- Run these queries AFTER creating the storage bucket
-- =====================================================

-- =====================================================
-- METHOD 1: PUBLIC BUCKET (RECOMMENDED - EASIEST)
-- =====================================================
-- If you created a PUBLIC bucket, no policies needed!
-- Just make sure the bucket is public in Dashboard:
-- Storage > documents > Settings > Make Public = ON

-- =====================================================
-- METHOD 2: PRIVATE BUCKET WITH POLICIES (ADVANCED)
-- =====================================================
-- If you want a PRIVATE bucket with controlled access,
-- run these policies:

-- 1. ALLOW PUBLIC TO READ/DOWNLOAD FILES
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents'
);

-- 2. ALLOW AUTHENTICATED USERS TO UPLOAD FILES
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  -- Only allow PDF, JPG, PNG files
  (storage.extension(name) = 'pdf' OR 
   storage.extension(name) = 'jpg' OR 
   storage.extension(name) = 'jpeg' OR 
   storage.extension(name) = 'png')
);

-- 3. ALLOW AUTHENTICATED USERS TO UPDATE/REPLACE FILES
CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
)
WITH CHECK (
  bucket_id = 'documents'
);

-- 4. ALLOW AUTHENTICATED USERS TO DELETE FILES
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
-- Check all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- DELETE POLICIES (IF NEEDED TO START FRESH)
-- =====================================================
-- DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- =====================================================
-- ALTERNATIVE: ALLOW SPECIFIC FOLDER PATH
-- =====================================================
-- If you want to restrict to project-documents folder only:

CREATE POLICY "Public can view project documents folder"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'project-documents'
);

CREATE POLICY "Authenticated can upload to project documents folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'project-documents' AND
  (storage.extension(name) = 'pdf' OR 
   storage.extension(name) = 'jpg' OR 
   storage.extension(name) = 'jpeg' OR 
   storage.extension(name) = 'png')
);

-- =====================================================
-- TEST QUERIES
-- =====================================================
-- List all files in bucket
SELECT 
  name,
  id,
  bucket_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'documents'
ORDER BY created_at DESC;

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'documents';
