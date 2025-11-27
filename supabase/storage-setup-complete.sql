-- ============================================
-- STORAGE POLICIES - Run this AFTER creating the bucket
-- ============================================
-- IMPORTANT: First create the bucket manually:
-- 1. Go to Storage in Supabase dashboard
-- 2. Click "Create bucket"
-- 3. Name: audio-recordings
-- 4. UNCHECK "Public bucket" (keep it private)
-- 5. Click "Create bucket"
-- 
-- THEN run this SQL:
-- ============================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DONE! Storage policies created.
-- ============================================

