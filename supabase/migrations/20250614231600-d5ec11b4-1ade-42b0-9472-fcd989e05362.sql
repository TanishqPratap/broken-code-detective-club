
-- Add thumbnail_url column to posts table
ALTER TABLE public.posts ADD COLUMN thumbnail_url TEXT;

-- Add thumbnail_url column to trailer_content table  
ALTER TABLE public.trailer_content ADD COLUMN thumbnail_url TEXT;

-- Add thumbnail_url column to content table (for ContentUploadModal)
ALTER TABLE public.content ADD COLUMN thumbnail_url TEXT;
