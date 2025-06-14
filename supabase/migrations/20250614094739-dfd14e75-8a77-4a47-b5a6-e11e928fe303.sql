
-- Add comments functionality to the posts_interactions table
-- The table already exists but we need to ensure it can handle comments properly

-- First, let's add an index for better performance when fetching comments
CREATE INDEX IF NOT EXISTS idx_posts_interactions_post_comments 
ON public.posts_interactions (post_id, interaction_type, created_at DESC) 
WHERE interaction_type = 'comment';

-- Add RLS policies specifically for comments if they don't exist
DO $$ 
BEGIN
  -- Check if the comment viewing policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts_interactions' 
    AND policyname = 'Users can view comments on posts'
  ) THEN
    CREATE POLICY "Users can view comments on posts" 
      ON public.posts_interactions 
      FOR SELECT 
      USING (interaction_type = 'comment');
  END IF;

  -- Check if the comment creation policy exists  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts_interactions' 
    AND policyname = 'Authenticated users can comment on posts'
  ) THEN
    CREATE POLICY "Authenticated users can comment on posts" 
      ON public.posts_interactions 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id AND interaction_type = 'comment' AND comment_text IS NOT NULL);
  END IF;
END $$;
