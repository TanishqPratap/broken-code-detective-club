
-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
  text_content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image/jpeg', 'video/mp4', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts_interactions table for likes, comments, etc.
CREATE TABLE public.posts_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, interaction_type) -- Prevent duplicate likes
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view all posts" 
  ON public.posts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own posts" 
  ON public.posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.posts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for posts_interactions
CREATE POLICY "Users can view all interactions" 
  ON public.posts_interactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create interactions" 
  ON public.posts_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
  ON public.posts_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" 
  ON public.posts_interactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true);

-- Storage policies for post media
CREATE POLICY "Public can view post media" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own post media" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
