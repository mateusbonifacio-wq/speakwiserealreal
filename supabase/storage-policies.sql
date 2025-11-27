-- Storage policies for audio-recordings bucket
-- Run this after creating the 'audio-recordings' bucket in Supabase Storage

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

