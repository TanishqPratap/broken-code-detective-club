
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      if (!postData) {
        toast.error("Post not found");
        navigate('/posts');
        return;
      }

      // Fetch likes count and user like status if authenticated
      let likesCount = 0;
      let userLiked = false;

      const { count, error: likesError } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('interaction_type', 'like');

      if (!likesError) {
        likesCount = count || 0;
      }

      if (user) {
        const { data: userLikeData, error: userLikeError } = await supabase
          .from('posts_interactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .maybeSingle();

        if (!userLikeError) {
          userLiked = !!userLikeData;
        }
      }

      // Ensure we have valid profile data
      if (!postData.profiles || typeof postData.profiles !== 'object') {
        toast.error("Could not load post author information");
        navigate('/posts');
        return;
      }

      // Type the content_type properly and construct the final post object
      const typedPost: Post = {
        ...postData,
        content_type: postData.content_type as 'text' | 'image' | 'video',
        profiles: postData.profiles as {
          display_name: string | null;
          username: string;
          avatar_url: string | null;
        },
        likes_count: likesCount,
        user_liked: userLiked
      };

      setPost(typedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error("Failed to load post");
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = () => {
    navigate('/posts');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Post not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/posts')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Post</h1>
        </div>

        <PostCard post={post} onDelete={handlePostDelete} />
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default PostView;
