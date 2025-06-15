
-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('story-media', 'story-media', true, 52428800, ARRAY['image/*', 'video/*']),
  ('post-media', 'post-media', true, 52428800, ARRAY['image/*', 'video/*']),
  ('trailer-content', 'trailer-content', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies with conditional checks
DO $$ 
BEGIN
    -- Story media policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload story media') THEN
        CREATE POLICY "Authenticated users can upload story media" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'story-media' AND
          auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view story media') THEN
        CREATE POLICY "Anyone can view story media" ON storage.objects
        FOR SELECT USING (bucket_id = 'story-media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own story media') THEN
        CREATE POLICY "Users can update their own story media" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'story-media' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own story media') THEN
        CREATE POLICY "Users can delete their own story media" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'story-media' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Post media policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload post media') THEN
        CREATE POLICY "Authenticated users can upload post media" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'post-media' AND
          auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view post media') THEN
        CREATE POLICY "Anyone can view post media" ON storage.objects
        FOR SELECT USING (bucket_id = 'post-media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own post media') THEN
        CREATE POLICY "Users can update their own post media" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'post-media' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own post media') THEN
        CREATE POLICY "Users can delete their own post media" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'post-media' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Trailer content policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload trailer content') THEN
        CREATE POLICY "Authenticated users can upload trailer content" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'trailer-content' AND
          auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view trailer content') THEN
        CREATE POLICY "Anyone can view trailer content" ON storage.objects
        FOR SELECT USING (bucket_id = 'trailer-content');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own trailer content') THEN
        CREATE POLICY "Users can update their own trailer content" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'trailer-content' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own trailer content') THEN
        CREATE POLICY "Users can delete their own trailer content" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'trailer-content' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- Enable RLS on tables if not already enabled
DO $$
BEGIN
    -- Check if RLS is already enabled on scheduled_posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'scheduled_posts' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Check if RLS is already enabled on stories
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'stories' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
