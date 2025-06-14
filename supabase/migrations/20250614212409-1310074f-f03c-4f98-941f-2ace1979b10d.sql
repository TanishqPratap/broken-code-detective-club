
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create policy to allow authenticated users to upload their own avatars
CREATE POLICY "Allow users to upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow public access to view avatars
CREATE POLICY "Allow public access to view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
