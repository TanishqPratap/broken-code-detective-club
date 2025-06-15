
-- Create notifications table to store all notification types
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'comment', 'like', 'follow', 'live_stream', 'tip', 'message', 'story_like')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  related_content_id UUID, -- Can reference posts, streams, etc.
  related_content_type TEXT, -- 'post', 'stream', 'story', etc.
  metadata JSONB DEFAULT '{}', -- Store additional data like amounts, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can create notifications (will be used by triggers and functions)
CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_user_id UUID DEFAULT NULL,
  p_related_content_id UUID DEFAULT NULL,
  p_related_content_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, related_user_id, 
    related_content_id, related_content_type, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_related_user_id,
    p_related_content_id, p_related_content_type, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function for new subscriptions
CREATE OR REPLACE FUNCTION public.notify_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscriber_name TEXT;
BEGIN
  -- Get subscriber's display name
  SELECT COALESCE(display_name, username) INTO subscriber_name
  FROM public.profiles 
  WHERE id = NEW.subscriber_id;
  
  -- Create notification for creator
  PERFORM public.create_notification(
    NEW.creator_id,
    'subscription',
    'New Subscription!',
    subscriber_name || ' subscribed to your content',
    NEW.subscriber_id,
    NULL,
    'subscription',
    jsonb_build_object('amount', NEW.current_period_end - NEW.current_period_start)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for new comments
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_creator_id UUID;
  commenter_name TEXT;
BEGIN
  -- Only notify for comments, not likes
  IF NEW.interaction_type = 'comment' THEN
    -- Get post creator
    SELECT user_id INTO post_creator_id
    FROM public.posts 
    WHERE id = NEW.post_id;
    
    -- Don't notify if commenting on own post
    IF post_creator_id != NEW.user_id THEN
      -- Get commenter's name
      SELECT COALESCE(display_name, username) INTO commenter_name
      FROM public.profiles 
      WHERE id = NEW.user_id;
      
      -- Create notification
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
$$;

-- Trigger function for new likes
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_creator_id UUID;
  liker_name TEXT;
BEGIN
  -- Only notify for likes
  IF NEW.interaction_type = 'like' THEN
    -- Get post creator
    SELECT user_id INTO post_creator_id
    FROM public.posts 
    WHERE id = NEW.post_id;
    
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
        '{}'::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for new follows
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's name
  SELECT COALESCE(display_name, username) INTO follower_name
  FROM public.profiles 
  WHERE id = NEW.follower_id;
  
  -- Create notification
  PERFORM public.create_notification(
    NEW.following_id,
    'follow',
    'New Follower',
    follower_name || ' started following you',
    NEW.follower_id,
    NULL,
    'follow',
    '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for live streams
CREATE OR REPLACE FUNCTION public.notify_live_stream()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creator_name TEXT;
  follower_record RECORD;
BEGIN
  -- Only notify when stream goes live
  IF OLD.status != 'live' AND NEW.status = 'live' THEN
    -- Get creator's name
    SELECT COALESCE(display_name, username) INTO creator_name
    FROM public.profiles 
    WHERE id = NEW.creator_id;
    
    -- Notify all followers
    FOR follower_record IN 
      SELECT follower_id 
      FROM public.follows 
      WHERE following_id = NEW.creator_id
    LOOP
      PERFORM public.create_notification(
        follower_record.follower_id,
        'live_stream',
        'Live Stream Started',
        creator_name || ' is now live: ' || NEW.title,
        NEW.creator_id,
        NEW.id,
        'stream',
        jsonb_build_object('stream_title', NEW.title)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for tips
CREATE OR REPLACE FUNCTION public.notify_new_tip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tipper_name TEXT;
BEGIN
  -- Get tipper's name
  SELECT COALESCE(display_name, username) INTO tipper_name
  FROM public.profiles 
  WHERE id = NEW.tipper_id;
  
  -- Create notification
  PERFORM public.create_notification(
    NEW.creator_id,
    'tip',
    'New Tip Received',
    tipper_name || ' sent you a tip of $' || NEW.amount::TEXT,
    NEW.tipper_id,
    NEW.content_id,
    'tip',
    jsonb_build_object('amount', NEW.amount, 'message', NEW.message)
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_new_subscription
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_subscription();

CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_like();

CREATE TRIGGER trigger_notify_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();

CREATE TRIGGER trigger_notify_live_stream
  AFTER UPDATE ON public.live_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_live_stream();

CREATE TRIGGER trigger_notify_new_tip
  AFTER INSERT ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_tip();
