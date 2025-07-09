-- Create storage policies for medicine-photos bucket
CREATE POLICY "Users can upload their own prescription images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own prescription images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medicine-photos' AND auth.uid()::text = (storage.foldername(name))[1]);