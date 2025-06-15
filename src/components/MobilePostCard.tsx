
import { useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

interface MobilePostCardProps {
  post: Post;
  onDelete?: () => void;
}

const MobilePostCard = ({ post, onDelete }: MobilePostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('posts_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;

        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
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

        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleComment = () => {
    if (post.content_type === 'vibe') {
      navigate(`/vibes/${post.id}`);
    } else {
      navigate(`/post/${post.id}`);
    }
  };

  const handleShare = () => {
    const url = post.content_type === 'vibe' 
      ? `${window.location.origin}/vibes/${post.id}`
      : `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.profiles.username}`);
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="w-8 h-8 cursor-pointer"
            onClick={handleProfileClick}
          >
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback>
              {post.profiles.display_name?.[0] || post.profiles.username[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span 
              className="font-semibold text-sm cursor-pointer"
              onClick={handleProfileClick}
            >
              {post.profiles.display_name || post.profiles.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {post.text_content && (
        <div className="px-3 pb-2">
          <p className="text-sm">{post.text_content}</p>
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="w-full">
          {post.content_type === 'image' ? (
            <img 
              src={post.media_url} 
              alt="Post content"
              className="w-full h-auto max-h-96 object-cover"
            />
          ) : post.content_type === 'video' ? (
            <video 
              src={post.media_url} 
              controls
              className="w-full h-auto max-h-96 object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="p-0 h-auto"
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="p-0 h-auto"
          >
            <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="p-0 h-auto"
          >
            <Share className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto"
        >
          <Bookmark className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </Button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <div className="px-3 pb-2">
          <span className="text-sm font-semibold">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MobilePostCard;
