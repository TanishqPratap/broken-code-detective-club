
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Trash2 } from "lucide-react";
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

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

const PostCard = ({ post, onDelete }: PostCardProps) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [userLiked, setUserLiked] = useState(post.user_liked || false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    setIsLiking(true);

    try {
      if (userLiked) {
        // Unlike
        const { error } = await supabase
          .from('posts_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;

        setLikes(prev => prev - 1);
        setUserLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from('posts_interactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            interaction_type: 'like'
          });

        if (error) throw error;

        setLikes(prev => prev + 1);
        setUserLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast.success("Post deleted successfully");
      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("Failed to delete post");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url || ''} />
              <AvatarFallback>
                {post.profiles.display_name?.[0] || post.profiles.username[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {post.profiles.display_name || post.profiles.username}
              </p>
              <p className="text-sm text-gray-500">
                @{post.profiles.username} • {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          {user?.id === post.user_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {post.content_type === 'text' && post.text_content && (
          <p className="text-gray-800 mb-4">{post.text_content}</p>
        )}

        {post.content_type === 'image' && post.media_url && (
          <div className="mb-4">
            <img 
              src={post.media_url} 
              alt="Post content" 
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}

        {post.content_type === 'video' && post.media_url && (
          <div className="mb-4">
            <video 
              src={post.media_url} 
              controls 
              className="w-full rounded-lg max-h-96"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 ${userLiked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`w-4 h-4 ${userLiked ? 'fill-current' : ''}`} />
            {likes}
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
            <MessageCircle className="w-4 h-4" />
            Comment
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
            <Share className="w-4 h-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
