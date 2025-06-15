
-- Create stories table for the Story System
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  text_overlay TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create scheduled_posts table for Content Scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_settings table for Push Notifications
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  new_followers BOOLEAN NOT NULL DEFAULT true,
  new_messages BOOLEAN NOT NULL DEFAULT true,
  live_streams BOOLEAN NOT NULL DEFAULT true,
  tips_received BOOLEAN NOT NULL DEFAULT true,
  content_interactions BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create storage buckets for stories and scheduled post media
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('story-media', 'story-media', true),
  ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories (drop existing if they exist)
DROP POLICY IF EXISTS "Users can view all stories" ON public.stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

CREATE POLICY "Users can view all stories" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own stories" ON public.stories FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Create RLS policies for scheduled_posts (drop existing if they exist)
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can create their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON public.scheduled_posts;

CREATE POLICY "Users can view their own scheduled posts" ON public.scheduled_posts FOR SELECT TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Users can create their own scheduled posts" ON public.scheduled_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own scheduled posts" ON public.scheduled_posts FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own scheduled posts" ON public.scheduled_posts FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Create RLS policies for notification_settings (drop existing if they exist)
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can create their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notification settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification settings" ON public.notification_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage policies for story-media bucket (drop existing if they exist)
DROP POLICY IF EXISTS "Users can upload story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own story media" ON storage.objects;

CREATE POLICY "Users can upload story media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view story media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'story-media');
CREATE POLICY "Users can update their own story media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own story media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'story-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for post-media bucket (drop existing if they exist)
DROP POLICY IF EXISTS "Users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;

CREATE POLICY "Users can upload post media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view post media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'post-media');
CREATE POLICY "Users can update their own post media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
