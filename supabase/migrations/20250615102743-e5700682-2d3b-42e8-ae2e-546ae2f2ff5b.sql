
-- First, let's check if the triggers exist and recreate them properly
-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.posts_interactions;
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.posts_interactions;
DROP TRIGGER IF EXISTS trigger_notify_new_subscription ON public.subscriptions;

-- Recreate the triggers with proper conditions
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'like')
  EXECUTE FUNCTION public.notify_new_like();

CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'comment')
  EXECUTE FUNCTION public.notify_new_comment();

CREATE TRIGGER trigger_notify_new_subscription
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_subscription();

-- Enable realtime for posts_interactions and subscriptions tables (notifications already enabled)
ALTER TABLE public.posts_interactions REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;

-- Add tables to realtime publication (skip notifications as it's already added)
DO $$
BEGIN
  -- Add posts_interactions to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'posts_interactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts_interactions;
  END IF;

  -- Add subscriptions to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;
