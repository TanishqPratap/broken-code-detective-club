
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";

interface Post {
  id: string;
  user_id: string;
  content_type: 'text' | 'image' | 'video';
  text_content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  user_liked?: boolean;
}

const PostFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      // First get posts with user profiles - fix the join syntax
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          text_content,
          media_url,
          media_type,
          created_at,
          profiles!posts_user_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Get likes count and user's like status for each post
      const postsWithLikes = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('posts_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('interaction_type', 'like');

          // Check if current user liked this post
          let userLiked = false;
          if (user) {
            const { data: userLikeData } = await supabase
              .from('posts_interactions')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .eq('interaction_type', 'like')
              .single();
            
            userLiked = !!userLikeData;
          }

          return {
            ...post,
            content_type: post.content_type as 'text' | 'image' | 'video',
            likes_count: likesCount || 0,
            user_liked: userLiked
          };
        })
      );

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = () => {
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {user && <CreatePost onPostCreated={handlePostCreated} />}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && <CreatePost onPostCreated={handlePostCreated} />}
      
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-600">Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onDelete={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
};

export default PostFeed;
