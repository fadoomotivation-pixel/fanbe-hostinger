# Deployment Trigger

This file was created to trigger a fresh deployment.

## Last Deployment
Date: 2026-02-20 23:40 IST

## Changes Applied
- ProjectsPage now loads hero images from Supabase Storage
- Path: `https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/{slug}/hero.jpg`
- Fallback to gradient backgrounds if images not found
- HomePage uses getProjectImagesFromDB() to fetch from Supabase first

## Expected Behavior After Deployment
1. ✅ Images load from Supabase storage bucket `project-images`
2. ✅ No more 422 errors for `/logos/` folder
3. ✅ Graceful fallback to colored gradients if hero.jpg missing
4. ✅ Loading skeletons while images load

## Verify Deployment
- Clear browser cache: Ctrl + Shift + R
- Check Network tab for Supabase URLs
- Images should load from: `mfgjzkaabyltscgrkhdz.supabase.co`
