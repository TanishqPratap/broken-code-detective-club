
-- Add parent_comment_id column to posts_interactions table to support nested replies
ALTER TABLE public.posts_interactions 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.posts_interactions(id);

-- Create an index for better performance when querying replies
CREATE INDEX IF NOT EXISTS idx_posts_interactions_parent_comment_id 
ON public.posts_interactions(parent_comment_id);

-- Update the notification function to handle comment replies
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_creator_id UUID;
  parent_comment_author_id UUID;
  commenter_name TEXT;
BEGIN
  -- Only notify for comments, not likes
  IF NEW.interaction_type = 'comment' THEN
    -- Get post creator
    SELECT user_id INTO post_creator_id
    FROM public.posts 
    WHERE id = NEW.post_id;
    
    -- Get commenter's name
    SELECT COALESCE(display_name, username) INTO commenter_name
    FROM public.profiles 
    WHERE id = NEW.user_id;
    
    -- If this is a reply to another comment
    IF NEW.parent_comment_id IS NOT NULL THEN
      -- Get the parent comment author
      SELECT user_id INTO parent_comment_author_id
      FROM public.posts_interactions
      WHERE id = NEW.parent_comment_id;
      
      -- Notify the parent comment author (if not replying to themselves)
      IF parent_comment_author_id != NEW.user_id THEN
        PERFORM public.create_notification(
          parent_comment_author_id,
          'comment_reply',
          'Reply to Your Comment',
          commenter_name || ' replied to your comment',
          NEW.user_id,
          NEW.post_id,
          'post',
          jsonb_build_object('comment_text', NEW.comment_text, 'parent_comment_id', NEW.parent_comment_id)
        );
      END IF;
    END IF;
    
    -- Always notify post creator (if not commenting on own post)
    IF post_creator_id != NEW.user_id THEN
      PERFORM public.create_notification(
        post_creator_id,
        'comment',
        'New Comment',
        commenter_name || ' commented on your post',
        NEW.user_id,
        NEW.post_id,
        'post',
        jsonb_build_object('comment_text', NEW.comment_text)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
