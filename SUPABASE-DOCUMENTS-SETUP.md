# 📄 Supabase Document Storage Setup Guide

Complete setup instructions for cloud document storage.

---

## 📋 Prerequisites

- Supabase account with project created
- Database access to your Supabase project

---

## 🔧 Step 1: Create Database Table

Go to: **Supabase Dashboard → SQL Editor → New Query**

Paste and run this SQL:

```sql
-- CREATE TABLE FOR DOCUMENT METADATA
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
  
  UNIQUE(project_slug, doc_type)
);

-- ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_project_documents_slug 
  ON project_documents(project_slug);

CREATE INDEX IF NOT EXISTS idx_project_documents_type 
  ON project_documents(doc_type);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- ALLOW PUBLIC READ ACCESS (website visitors)
CREATE POLICY "Allow public read access" 
  ON project_documents
  FOR SELECT
  TO public
  USING (true);

-- ALLOW AUTHENTICATED FULL ACCESS (CRM admins)
CREATE POLICY "Allow authenticated users full access" 
  ON project_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

✅ **Verify table created:**
```sql
SELECT * FROM project_documents LIMIT 1;
```

---

## 🗂️ Step 2: Create Storage Bucket

### Option A: Public Bucket (RECOMMENDED - Easiest)

1. Go to **Supabase Dashboard → Storage**
2. Click **"New Bucket"**
3. Fill in:
   - **Name:** `documents`
   - **Public:** ✅ **ON** (check this box)
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** (leave empty or add: `application/pdf,image/jpeg,image/png`)
4. Click **"Create Bucket"**

**No policies needed!** Public buckets work automatically.

---

### Option B: Private Bucket with Policies (Advanced)

If you want more control, create a **private bucket** and run these policies:

Go to: **Supabase Dashboard → SQL Editor → New Query**

```sql
-- 1. ALLOW PUBLIC TO READ/DOWNLOAD FILES
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents'
);

-- 2. ALLOW AUTHENTICATED USERS TO UPLOAD
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.extension(name) = 'pdf' OR 
   storage.extension(name) = 'jpg' OR 
   storage.extension(name) = 'jpeg' OR 
   storage.extension(name) = 'png')
);

-- 3. ALLOW AUTHENTICATED USERS TO UPDATE
CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- 4. ALLOW AUTHENTICATED USERS TO DELETE
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

---

## ✅ Step 3: Verify Setup

Run these queries to verify everything is working:

```sql
-- Check table exists
SELECT * FROM project_documents;

-- Check table policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'project_documents';

-- Check bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'documents';

-- Check storage policies (only if using private bucket)
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

---

## 🚀 Step 4: Deploy Code

```bash
git pull origin main
npm install
npm run build
```

---

## 🧪 Step 5: Test Upload

1. Login to CRM: `https://fanbegroup.com/crm/login`
2. Go to: **CMS → Project Documents**
3. Select a project
4. Upload a test PDF (max 10MB)
5. Should see: ✅ **"Upload Successful"**
6. Document appears with **"Open"** button

---

## 🔍 Troubleshooting

### ❌ Upload fails with "Failed to upload"

**Solution:**
- Check bucket name is exactly `documents`
- Verify bucket is public OR policies are set
- Check Supabase project URL and anon key in `.env`

### ❌ "Storage bucket not found"

**Solution:**
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'documents';
```
If empty, create the bucket again.

### ❌ "Row level security policy violation"

**Solution:**
- Make sure you're logged in to CRM
- Check authentication token is valid
- Re-run the RLS policy SQL

### ❌ Documents don't appear on project pages

**Solution:**
- Check `project_documents` table has data:
  ```sql
  SELECT * FROM project_documents;
  ```
- Verify project slug matches exactly
- Clear browser cache and reload

---

## 📊 Useful Queries

### View all uploaded documents
```sql
SELECT 
  project_slug,
  doc_type,
  filename,
  file_size / 1024 as size_kb,
  uploaded_at
FROM project_documents
ORDER BY uploaded_at DESC;
```

### Delete a specific document
```sql
DELETE FROM project_documents 
WHERE project_slug = 'shree-kunj-bihari' 
AND doc_type = 'brochure';
```

### Clear all documents (testing only)
```sql
TRUNCATE TABLE project_documents;
```

### Check storage usage
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_mb
FROM storage.objects
WHERE bucket_id = 'documents'
GROUP BY bucket_id;
```

---

## 🎉 Success!

You now have:
- ✅ Unlimited cloud storage for documents
- ✅ Fast CDN delivery
- ✅ No localStorage quota issues
- ✅ Documents accessible from any device
- ✅ Automatic display on project pages

---

## 📚 Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
