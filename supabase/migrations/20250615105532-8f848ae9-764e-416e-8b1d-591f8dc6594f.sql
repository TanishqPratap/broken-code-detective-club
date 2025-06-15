
-- First, let's see what policies exist and drop them properly
DO $$ 
DECLARE
    pol_name text;
BEGIN
    -- Drop all existing policies on posts_interactions table
    FOR pol_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'posts_interactions' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.posts_interactions';
    END LOOP;
END $$;

-- Now create the new policies
CREATE POLICY "Users can view all interactions" 
  ON public.posts_interactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own interactions" 
  ON public.posts_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" 
  ON public.posts_interactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.posts_interactions ENABLE ROW LEVEL SECURITY;
