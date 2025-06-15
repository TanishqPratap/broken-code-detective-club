
-- Add foreign key constraint between posts and profiles tables
ALTER TABLE public.posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
