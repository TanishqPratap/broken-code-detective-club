
-- First, let's create a proper trigger function for vibes comments and likes
-- This will handle notifications for interactions on vibes (which are stored as posts with content_type 'vibe')

CREATE OR REPLACE FUNCTION public.notify_vibe_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vibe_creator_id UUID;
  parent_comment_author_id UUID;
  user_name TEXT;
  vibe_data RECORD;
BEGIN
  -- Get vibe creator and vibe details
  SELECT user_id, title, content_type INTO vibe_data
  FROM public.posts 
  WHERE id = NEW.post_id;
  
  -- Only proceed if this is actually a vibe
  IF vibe_data.content_type != 'vibe' THEN
    RETURN NEW;
  END IF;
  
  vibe_creator_id := vibe_data.user_id;
  
  -- Get user's name for the notification
  SELECT COALESCE(display_name, username) INTO user_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Handle comments
  IF NEW.interaction_type = 'comment' THEN
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
          user_name || ' replied to your comment on a vibe',
          NEW.user_id,
          NEW.post_id,
          'vibe',
          jsonb_build_object(
            'comment_text', NEW.comment_text, 
            'parent_comment_id', NEW.parent_comment_id,
            'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/vibes/' || NEW.post_id,
            'vibe_title', vibe_data.title
          )
        );
      END IF;
    END IF;
    
    -- Always notify vibe creator (if not commenting on own vibe)
    IF vibe_creator_id != NEW.user_id THEN
      PERFORM public.create_notification(
        vibe_creator_id,
        'comment',
        'New Comment on Your Vibe',
        user_name || ' commented on your vibe',
        NEW.user_id,
        NEW.post_id,
        'vibe',
        jsonb_build_object(
          'comment_text', NEW.comment_text,
          'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/vibes/' || NEW.post_id,
          'vibe_title', vibe_data.title
        )
      );
    END IF;
  
  -- Handle likes
  ELSIF NEW.interaction_type = 'like' THEN
    -- Don't notify if liking own vibe
    IF vibe_creator_id != NEW.user_id THEN
      PERFORM public.create_notification(
        vibe_creator_id,
        'like',
        'Someone Liked Your Vibe',
        user_name || ' liked your vibe',
        NEW.user_id,
        NEW.post_id,
        'vibe',
        jsonb_build_object(
          'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/vibes/' || NEW.post_id,
          'vibe_title', vibe_data.title
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for vibe interactions
DROP TRIGGER IF EXISTS trigger_notify_vibe_interaction ON public.posts_interactions;
CREATE TRIGGER trigger_notify_vibe_interaction
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vibe_interaction();

-- Also update the existing post notification function to exclude vibes (to avoid duplicate notifications)
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_creator_id UUID;
  parent_comment_author_id UUID;
  commenter_name TEXT;
  post_data RECORD;
BEGIN
  -- Only notify for comments, not likes
  IF NEW.interaction_type = 'comment' THEN
    -- Get post creator and check if it's a vibe
    SELECT user_id, content_type INTO post_data
    FROM public.posts 
    WHERE id = NEW.post_id;
    
    -- Skip if this is a vibe (handled by separate trigger)
    IF post_data.content_type = 'vibe' THEN
      RETURN NEW;
    END IF;
    
    post_creator_id := post_data.user_id;
    
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
          jsonb_build_object(
            'comment_text', NEW.comment_text, 
            'parent_comment_id', NEW.parent_comment_id,
            'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/posts/' || NEW.post_id
          )
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
        jsonb_build_object(
          'comment_text', NEW.comment_text,
          'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/posts/' || NEW.post_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the like notification function to exclude vibes and add canonical URLs
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_creator_id UUID;
  liker_name TEXT;
  post_data RECORD;
BEGIN
  -- Only notify for likes
  IF NEW.interaction_type = 'like' THEN
    -- Get post creator and check if it's a vibe
    SELECT user_id, content_type INTO post_data
    FROM public.posts 
    WHERE id = NEW.post_id;
    
    -- Skip if this is a vibe (handled by separate trigger)
    IF post_data.content_type = 'vibe' THEN
      RETURN NEW;
    END IF;
    
    post_creator_id := post_data.user_id;
    
    -- Don't notify if liking own post
    IF post_creator_id != NEW.user_id THEN
      -- Get liker's name
      SELECT COALESCE(display_name, username) INTO liker_name
      FROM public.profiles 
      WHERE id = NEW.user_id;
      
      -- Create notification
      PERFORM public.create_notification(
        post_creator_id,
        'like',
        'New Like',
        liker_name || ' liked your post',
        NEW.user_id,
        NEW.post_id,
        'post',
        jsonb_build_object(
          'canonical_url', 'https://b78fb01f-e4ac-4dbe-be8b-a4f52948d703.lovableproject.com/posts/' || NEW.post_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
