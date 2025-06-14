
-- Create a new table for trailer interactions since trailers are separate from posts
CREATE TABLE public.trailer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trailer_id UUID NOT NULL REFERENCES public.trailer_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  comment_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a partial unique index for likes (only one like per user per trailer)
CREATE UNIQUE INDEX trailer_interactions_unique_like 
ON public.trailer_interactions (trailer_id, user_id) 
WHERE interaction_type = 'like';

-- Enable RLS
ALTER TABLE public.trailer_interactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view all trailer interactions (public content)
CREATE POLICY "Anyone can view trailer interactions" ON public.trailer_interactions
FOR SELECT USING (true);

-- Policy for authenticated users to create interactions
CREATE POLICY "Authenticated users can create trailer interactions" ON public.trailer_interactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own interactions
CREATE POLICY "Users can update their own trailer interactions" ON public.trailer_interactions
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own interactions
CREATE POLICY "Users can delete their own trailer interactions" ON public.trailer_interactions
FOR DELETE USING (auth.uid() = user_id);
