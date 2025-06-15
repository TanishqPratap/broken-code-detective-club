
-- Add parent_comment_id column to content_interactions table to support replies
ALTER TABLE public.content_interactions 
ADD COLUMN parent_comment_id uuid REFERENCES public.content_interactions(id);

-- Update the unique constraint to allow multiple comments but still prevent duplicate likes
-- Drop the existing constraint first
ALTER TABLE public.content_interactions 
DROP CONSTRAINT IF EXISTS content_interactions_content_id_user_id_interaction_type_comment_text_key;

-- Create a new unique constraint only for likes (not comments)
CREATE UNIQUE INDEX content_interactions_unique_likes 
ON public.content_interactions (content_id, user_id) 
WHERE interaction_type = 'like';

-- Update the notify_content_comment function to handle replies
CREATE OR REPLACE FUNCTION public.notify_content_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  content_creator_id UUID;
  parent_comment_author_id UUID;
  commenter_name TEXT;
BEGIN
  -- Only notify for comments
  IF NEW.interaction_type = 'comment' THEN
    -- Get content creator
    SELECT creator_id INTO content_creator_id
    FROM public.content 
    WHERE id = NEW.content_id;
    
    -- Get commenter's name
    SELECT COALESCE(display_name, username) INTO commenter_name
    FROM public.profiles 
    WHERE id = NEW.user_id;
    
    -- If this is a reply to another comment
    IF NEW.parent_comment_id IS NOT NULL THEN
      -- Get the parent comment author
      SELECT user_id INTO parent_comment_author_id
      FROM public.content_interactions
      WHERE id = NEW.parent_comment_id;
      
      -- Notify the parent comment author (if not replying to themselves)
      IF parent_comment_author_id != NEW.user_id THEN
        PERFORM public.create_notification(
          parent_comment_author_id,
          'comment_reply',
          'Reply to Your Comment',
          commenter_name || ' replied to your comment',
          NEW.user_id,
          NEW.content_id,
          'content',
          jsonb_build_object('comment_text', NEW.comment_text, 'parent_comment_id', NEW.parent_comment_id)
        );
      END IF;
    END IF;
    
    -- Always notify content creator (if not commenting on own content)
    IF content_creator_id != NEW.user_id THEN
      PERFORM public.create_notification(
        content_creator_id,
        'comment',
        'New Comment on Content',
        commenter_name || ' commented on your content',
        NEW.user_id,
        NEW.content_id,
        'content',
        jsonb_build_object('comment_text', NEW.comment_text)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
