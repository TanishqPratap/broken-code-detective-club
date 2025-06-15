
-- Create content_interactions table for likes and comments on content
CREATE TABLE public.content_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid NOT NULL,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  comment_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(content_id, user_id, interaction_type, comment_text)
);

-- Enable RLS on content_interactions
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_interactions
CREATE POLICY "Users can view all content interactions" 
  ON public.content_interactions 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own content interactions" 
  ON public.content_interactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content interactions" 
  ON public.content_interactions 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content interactions" 
  ON public.content_interactions 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to notify about content likes
CREATE OR REPLACE FUNCTION public.notify_content_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  content_creator_id UUID;
  liker_name TEXT;
BEGIN
  -- Only notify for likes
  IF NEW.interaction_type = 'like' THEN
    -- Get content creator
    SELECT creator_id INTO content_creator_id
    FROM public.content 
    WHERE id = NEW.content_id;
    
    -- Don't notify if liking own content
    IF content_creator_id != NEW.user_id THEN
      -- Get liker's name
      SELECT COALESCE(display_name, username) INTO liker_name
      FROM public.profiles 
      WHERE id = NEW.user_id;
      
      -- Create notification
      PERFORM public.create_notification(
        content_creator_id,
        'like',
        'Content Liked',
        liker_name || ' liked your content',
        NEW.user_id,
        NEW.content_id,
        'content',
        '{}'::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to notify about content comments
CREATE OR REPLACE FUNCTION public.notify_content_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  content_creator_id UUID;
  commenter_name TEXT;
BEGIN
  -- Only notify for comments
  IF NEW.interaction_type = 'comment' THEN
    -- Get content creator
    SELECT creator_id INTO content_creator_id
    FROM public.content 
    WHERE id = NEW.content_id;
    
    -- Don't notify if commenting on own content
    IF content_creator_id != NEW.user_id THEN
      -- Get commenter's name
      SELECT COALESCE(display_name, username) INTO commenter_name
      FROM public.profiles 
      WHERE id = NEW.user_id;
      
      -- Create notification
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

-- Create triggers for content interactions
CREATE TRIGGER notify_content_like_trigger
  AFTER INSERT ON public.content_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_content_like();

CREATE TRIGGER notify_content_comment_trigger
  AFTER INSERT ON public.content_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_content_comment();
