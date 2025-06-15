
-- Add parent_comment_id column to stream_comments table to support nested replies
ALTER TABLE public.stream_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.stream_comments(id);

-- Create an index for better performance when querying replies
CREATE INDEX IF NOT EXISTS idx_stream_comments_parent_comment_id 
ON public.stream_comments(parent_comment_id);

-- Update the notification function to handle stream comment replies
CREATE OR REPLACE FUNCTION public.notify_new_stream_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  stream_creator_id UUID;
  parent_comment_author_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get stream creator
  SELECT creator_id INTO stream_creator_id
  FROM public.live_streams 
  WHERE id = NEW.stream_id;
  
  -- Get commenter's name
  SELECT COALESCE(display_name, username) INTO commenter_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- If this is a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the parent comment author
    SELECT user_id INTO parent_comment_author_id
    FROM public.stream_comments
    WHERE id = NEW.parent_comment_id;
    
    -- Notify the parent comment author (if not replying to themselves)
    IF parent_comment_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        parent_comment_author_id,
        'comment_reply',
        'Reply to Your Stream Comment',
        commenter_name || ' replied to your stream comment',
        NEW.user_id,
        NEW.stream_id,
        'stream',
        jsonb_build_object('comment_text', NEW.comment, 'parent_comment_id', NEW.parent_comment_id)
      );
    END IF;
  END IF;
  
  -- Always notify stream creator (if not commenting on own stream)
  IF stream_creator_id != NEW.user_id THEN
    PERFORM public.create_notification(
      stream_creator_id,
      'comment',
      'New Stream Comment',
      commenter_name || ' commented on your livestream',
      NEW.user_id,
      NEW.stream_id,
      'stream',
      jsonb_build_object('comment_text', NEW.comment)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for stream comments
DROP TRIGGER IF EXISTS trigger_notify_new_stream_comment ON public.stream_comments;
CREATE TRIGGER trigger_notify_new_stream_comment
  AFTER INSERT ON public.stream_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_stream_comment();
