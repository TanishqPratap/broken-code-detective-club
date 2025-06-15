
-- Create RLS policies for scheduled_posts table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can view their own scheduled posts') THEN
        CREATE POLICY "Users can view their own scheduled posts" 
          ON public.scheduled_posts 
          FOR SELECT 
          USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can create their own scheduled posts') THEN
        CREATE POLICY "Users can create their own scheduled posts" 
          ON public.scheduled_posts 
          FOR INSERT 
          WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can update their own scheduled posts') THEN
        CREATE POLICY "Users can update their own scheduled posts" 
          ON public.scheduled_posts 
          FOR UPDATE 
          USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can delete their own scheduled posts') THEN
        CREATE POLICY "Users can delete their own scheduled posts" 
          ON public.scheduled_posts 
          FOR DELETE 
          USING (auth.uid() = creator_id);
    END IF;
END $$;

-- Create RLS policies for stories table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can view all active stories') THEN
        CREATE POLICY "Users can view all active stories" 
          ON public.stories 
          FOR SELECT 
          USING (expires_at > now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can create their own stories') THEN
        CREATE POLICY "Users can create their own stories" 
          ON public.stories 
          FOR INSERT 
          WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can update their own stories') THEN
        CREATE POLICY "Users can update their own stories" 
          ON public.stories 
          FOR UPDATE 
          USING (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can delete their own stories') THEN
        CREATE POLICY "Users can delete their own stories" 
          ON public.stories 
          FOR DELETE 
          USING (auth.uid() = creator_id);
    END IF;
END $$;

-- Enable realtime for stories table
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
