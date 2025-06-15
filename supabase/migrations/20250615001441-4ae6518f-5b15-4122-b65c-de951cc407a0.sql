
-- Add columns to messages table to support one-time media
ALTER TABLE public.messages 
ADD COLUMN is_one_time_media boolean DEFAULT false,
ADD COLUMN viewed_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient querying of one-time media
CREATE INDEX idx_messages_one_time_media ON public.messages(is_one_time_media, viewed_at) WHERE is_one_time_media = true;
