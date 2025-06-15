
-- Create story_likes table to track story likes
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS for story_likes
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_likes
CREATE POLICY "Users can view all story likes" 
  ON public.story_likes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own story likes" 
  ON public.story_likes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story likes" 
  ON public.story_likes 
  FOR DELETE 
  USING (auth.uid() = user_id);
