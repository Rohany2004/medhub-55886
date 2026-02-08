-- Fix storage policies - only drop the public access policy and update bucket
-- The upload/update/delete policies already exist, we just need to fix the SELECT

-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Medicine photos are publicly accessible" ON storage.objects;

-- Drop and recreate the view policy to ensure it's correct
DROP POLICY IF EXISTS "Users can view their own medicine photos" ON storage.objects;

CREATE POLICY "Users can view their own medicine photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);