
-- Add 'reel' content type to existing posts table for Vibes functionality
-- Add metadata column to store reel-specific information like effects, music, duration
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add constraint to ensure content_type includes 'reel'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_content_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_content_type_check 
CHECK (content_type IN ('text', 'image', 'video', 'reel'));

-- Create index on content_type for efficient querying of reels
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);

-- Create index on metadata for efficient querying of reel features
CREATE INDEX IF NOT EXISTS idx_posts_metadata ON posts USING GIN(metadata);

-- Add duration column for video/reel content
ALTER TABLE posts ADD COLUMN IF NOT EXISTS duration INTEGER; -- duration in seconds
