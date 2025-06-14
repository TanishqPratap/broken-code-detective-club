
-- Remove the existing unique constraint that prevents multiple comments
-- and create a new one that only applies to likes
ALTER TABLE public.posts_interactions 
DROP CONSTRAINT IF EXISTS posts_interactions_post_id_user_id_interaction_type_key;

-- Create a new unique constraint only for likes (not comments)
-- This allows multiple comments but prevents duplicate likes
CREATE UNIQUE INDEX posts_interactions_unique_likes 
ON public.posts_interactions (post_id, user_id) 
WHERE interaction_type = 'like';
