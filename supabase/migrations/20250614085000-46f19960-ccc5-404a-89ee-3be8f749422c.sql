
-- Add playback_id column to store the Livepeer playbackId for HLS playback
ALTER TABLE public.live_streams 
ADD COLUMN playback_id TEXT;

-- Optional: Backfill existing streams if you already have playbackId values elsewhere
-- UPDATE public.live_streams SET playback_id = ... WHERE ...;
