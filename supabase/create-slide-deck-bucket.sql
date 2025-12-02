-- Create storage bucket for project slide decks
-- Run this in Supabase SQL Editor after creating the bucket manually

-- Note: Buckets must be created via Supabase Dashboard or Storage API
-- This file is for reference only

-- To create the bucket:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create bucket"
-- 3. Name: "project-decks"
-- 4. Set to Private (uncheck "Public bucket")
-- 5. Click "Create bucket"

-- Then run the storage policies below:

-- Storage policies for project-decks bucket
-- Path format: {projectId}/deck.pdf
-- Users can upload files to their own projects
CREATE POLICY "Users can upload to own project decks"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-decks' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Users can read files from their own projects
CREATE POLICY "Users can read own project decks"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-decks' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Users can update files in their own projects
CREATE POLICY "Users can update own project decks"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-decks' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Users can delete files from their own projects
CREATE POLICY "Users can delete own project decks"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-decks' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

