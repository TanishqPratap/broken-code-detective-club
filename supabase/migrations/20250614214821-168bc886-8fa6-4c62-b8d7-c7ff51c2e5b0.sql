
-- Create trailer_content table
CREATE TABLE public.trailer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  order_position INTEGER NOT NULL CHECK (order_position BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_id, order_position)
);

-- Enable RLS
ALTER TABLE public.trailer_content ENABLE ROW LEVEL SECURITY;

-- Policy for creators to manage their own trailer content
CREATE POLICY "Creators can manage their own trailer content" ON public.trailer_content
FOR ALL USING (auth.uid() = creator_id);

-- Policy for public to view all trailer content (since it's free preview content)
CREATE POLICY "Public can view trailer content" ON public.trailer_content
FOR SELECT USING (true);

-- Create storage bucket for trailer content
INSERT INTO storage.buckets (id, name, public)
VALUES ('trailer-content', 'trailer-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trailer content
CREATE POLICY "Allow creators to upload trailer content" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'trailer-content' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow creators to update their trailer content" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'trailer-content' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public access to view trailer content" ON storage.objects
FOR SELECT USING (bucket_id = 'trailer-content');
