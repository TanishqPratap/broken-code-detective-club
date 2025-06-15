
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { X, Send, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
  replies?: Comment[];
  likes_count: number;
  user_liked: boolean;
}

interface VibesCommentsProps {
  vibeId: string;
  isOpen: boolean;
  onClose: () => void;
}

const VibesComments = ({ vibeId, isOpen, onClose }: VibesCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // First, try to get comments using a simpler query without parent_comment_id
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('posts_interactions')
        .select('id, comment_text, created_at, user_id, interaction_type')
        .eq('post_id', vibeId)
        .eq('interaction_type', 'comment')
        .order('created_at', { ascending: true });

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
        setComments([]);
        return;
      }

      if (interactionsData && interactionsData.length > 0) {
        // Get user profiles for the comments
        const userIds = [...new Set(interactionsData.map(comment => comment.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setComments([]);
          return;
        }

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        // Process comments with profiles
        const processedComments: Comment[] = interactionsData.map(comment => ({
          id: comment.id,
          comment_text: comment.comment_text || '',
          created_at: comment.created_at,
          user_id: comment.user_id,
          parent_comment_id: null, // For now, all comments are top-level
          profiles: profilesMap.get(comment.user_id) || null,
          replies: [],
          likes_count: 0,
          user_liked: false
        }));

        setComments(processedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vibeId) {
      fetchComments();
    }
  }, [isOpen, vibeId]);

  const handleSubmitComment = async (parentId: string | null = null) => {
    const text = parentId ? replyText : newComment;
    if (!user || !text.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('posts_interactions')
        .insert({
          post_id: vibeId,
          user_id: user.id,
          interaction_type: 'comment',
          comment_text: text.trim()
        });

      if (error) throw error;

      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      
      fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      if (currentlyLiked) {
        await supabase
          .from('posts_interactions')
          .delete()
          .eq('post_id', vibeId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');
      } else {
        await supabase
          .from('posts_interactions')
          .insert({
            post_id: vibeId,
            user_id: user.id,
            interaction_type: 'like'
          });
      }

      toast.success(currentlyLiked ? 'Unliked' : 'Liked');
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const renderComment = (comment: Comment): JSX.Element => (
    <div key={comment.id}>
      <div className="flex space-x-3 mb-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || ""} />
          <AvatarFallback className="bg-gray-600 text-white text-xs">
            {comment.profiles?.display_name?.[0]?.toUpperCase() || 
             comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">
              {comment.profiles?.display_name || comment.profiles?.username || 'Unknown'}
            </span>
            <span className="text-gray-400 text-xs">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-100 break-words mb-2">
            {comment.comment_text}
          </p>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id, comment.user_liked)}
              className="text-gray-400 hover:text-white text-xs p-0 h-auto"
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
              {comment.likes_count > 0 ? comment.likes_count : 'Like'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="text-gray-400 hover:text-white text-xs p-0 h-auto"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
          
          {/* Reply input for this specific comment */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex items-center space-x-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-600 text-white text-xs">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment(comment.id);
                    }
                  }}
                />
                <Button
                  onClick={() => handleSubmitComment(comment.id)}
                  disabled={!replyText.trim() || submitting}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Comments Panel */}
      <div className="w-80 bg-black text-white flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">Comments</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-gray-800 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading comments...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <p className="font-medium">No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-600 text-white text-xs">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300 p-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              <p>Sign in to leave a comment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VibesComments;
