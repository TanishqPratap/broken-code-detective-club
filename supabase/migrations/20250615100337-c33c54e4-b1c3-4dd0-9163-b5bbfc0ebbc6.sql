
-- Create function to notify about new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sender_name TEXT;
  notification_count INTEGER;
BEGIN
  -- Get sender's name
  SELECT COALESCE(display_name, username) INTO sender_name
  FROM public.profiles 
  WHERE id = NEW.sender_id;
  
  -- Check if we've already sent a message notification for this conversation in the last hour
  SELECT COUNT(*) INTO notification_count
  FROM public.notifications
  WHERE user_id = NEW.recipient_id 
    AND related_user_id = NEW.sender_id
    AND type = 'message'
    AND created_at > now() - interval '1 hour';
  
  -- Only create notification if no recent message notification exists
  IF notification_count = 0 THEN
    PERFORM public.create_notification(
      NEW.recipient_id,
      'message',
      'New Message',
      sender_name || ' sent you a message',
      NEW.sender_id,
      NULL,
      'message',
      jsonb_build_object('message_preview', LEFT(NEW.content, 50))
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to notify about story likes
CREATE OR REPLACE FUNCTION public.notify_story_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  story_creator_id UUID;
  liker_name TEXT;
BEGIN
  -- Get story creator
  SELECT creator_id INTO story_creator_id
  FROM public.stories 
  WHERE id = NEW.story_id;
  
  -- Don't notify if liking own story
  IF story_creator_id != NEW.user_id THEN
    -- Get liker's name
    SELECT COALESCE(display_name, username) INTO liker_name
    FROM public.profiles 
    WHERE id = NEW.user_id;
    
    -- Create notification
    PERFORM public.create_notification(
      story_creator_id,
      'story_like',
      'Story Liked',
      liker_name || ' liked your story',
      NEW.user_id,
      NEW.story_id,
      'story',
      '{}'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

CREATE TRIGGER notify_story_like_trigger
  AFTER INSERT ON public.story_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_story_like();
