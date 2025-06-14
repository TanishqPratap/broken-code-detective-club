
-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload chat media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to view chat media
CREATE POLICY "Allow authenticated users to view chat media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated'
);

-- Add media columns to messages table
ALTER TABLE messages 
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video', 'audio'));
