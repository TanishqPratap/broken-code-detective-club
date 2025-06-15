
-- Update the notifications table check constraint to include all valid notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'like', 
  'comment', 
  'comment_reply', 
  'follow', 
  'subscription', 
  'tip', 
  'message', 
  'live_stream', 
  'story_like',
  'content_like',
  'content_comment'
));
