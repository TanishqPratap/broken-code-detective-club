
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

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
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch comments when component loads or when showComments changes
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  // Fetch comments count on component mount
  useEffect(() => {
    fetchCommentsCount();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Get comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from('posts_interactions')
        .select('id, user_id, comment_text, created_at')
        .eq('post_id', post.id)
        .eq('interaction_type', 'comment')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get user profiles for comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.id, profile]) || []
      );

      // Combine comments with profiles
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || {
          display_name: null,
          username: 'Unknown User',
          avatar_url: null
        }
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('interaction_type', 'comment');

      if (error) throw error;
      setCommentsCount(count || 0);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('posts_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
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
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('posts_interactions')
        .insert({
          post_id: post.id,
          user_id: user.id,
          interaction_type: 'comment',
          comment_text: commentText.trim()
        });

      if (error) throw error;

      setCommentText("");
      setCommentsCount(prev => prev + 1);
      
      // Refresh comments if they're currently displayed
      if (showComments) {
        fetchComments();
      }
      
      toast.success("Comment added!");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Check out this post by ${post.profiles.display_name || post.profiles.username}`,
      text: post.text_content || `Amazing content from ${post.profiles.display_name || post.profiles.username}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Post shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to share post");
    }
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.user_id) return;

    if (!confirm("Are you sure you want to delete this post?")) return;

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url || ""} />
              <AvatarFallback>
                {(post.profiles.display_name || post.profiles.username)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">
                {post.profiles.display_name || post.profiles.username}
              </h4>
              <p className="text-sm text-muted-foreground">
                @{post.profiles.username} • {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && user.id === post.user_id && (
              <Button variant="ghost" size="sm" onClick={handleDeletePost}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Content */}
        {post.text_content && (
          <p className="mb-4 whitespace-pre-wrap">{post.text_content}</p>
        )}
        
        {post.media_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
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
                className="w-full h-auto max-h-96"
              />
            ) : null}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={isLiked ? "text-red-500" : ""}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {commentsCount}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Add Comment Input */}
            {user && (
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Display Comments */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.profiles.avatar_url || ""} />
                      <AvatarFallback>
                        {(comment.profiles.display_name || comment.profiles.username)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.profiles.display_name || comment.profiles.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
