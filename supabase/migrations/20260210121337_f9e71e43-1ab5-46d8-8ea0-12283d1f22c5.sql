
-- Add missing storage policies for profile-images (skip existing ones)
DO $$
BEGIN
  -- Try to create upload policy for profile-images
  BEGIN
    CREATE POLICY "Auth users can upload profile images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  -- Try to create update policy for profile-images  
  BEGIN
    CREATE POLICY "Auth users can update profile images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
