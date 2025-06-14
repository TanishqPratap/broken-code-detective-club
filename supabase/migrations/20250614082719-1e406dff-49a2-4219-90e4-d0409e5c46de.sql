
-- Create comments table for livestreams
CREATE TABLE public.stream_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tips table for livestreams
CREATE TABLE public.stream_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  tipper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments - anyone can read comments for public streams
CREATE POLICY "Anyone can view stream comments" 
  ON public.stream_comments 
  FOR SELECT 
  USING (true);

-- Users can create comments if authenticated
CREATE POLICY "Authenticated users can create comments" 
  ON public.stream_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
  ON public.stream_comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON public.stream_comments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for tips - anyone can view tips
CREATE POLICY "Anyone can view stream tips" 
  ON public.stream_tips 
  FOR SELECT 
  USING (true);

-- Users can create tips if authenticated
CREATE POLICY "Authenticated users can send tips" 
  ON public.stream_tips 
  FOR INSERT 
  WITH CHECK (auth.uid() = tipper_id);

-- Enable realtime for comments and tips
ALTER TABLE public.stream_comments REPLICA IDENTITY FULL;
ALTER TABLE public.stream_tips REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_tips;
