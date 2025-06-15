
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface ContentInteractionsProps {
  contentId: string;
  onInteractionChange?: () => void;
}

interface Interaction {
  id: string;
  user_id: string;
  interaction_type: 'like' | 'comment';
  comment_text: string | null;
  parent_comment_id: string | null;
  created_at: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: Interaction[];
}

const ContentInteractions = ({ contentId, onInteractionChange }: ContentInteractionsProps) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const fetchInteractions = async () => {
    try {
      const { data: interactionsData, error } = await supabase
        .from('content_interactions')
        .select(`
          id,
          user_id,
          interaction_type,
          comment_text,
          parent_comment_id,
          created_at
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (interactionsData && interactionsData.length > 0) {
        // Get user profiles for interactions
        const userIds = [...new Set(interactionsData.map(i => i.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        const processedInteractions: Interaction[] = interactionsData.map(interaction => ({
          ...interaction,
          interaction_type: interaction.interaction_type as 'like' | 'comment',
          user: profilesMap.get(interaction.user_id) || {
            username: 'Unknown User',
            display_name: null,
            avatar_url: null
          }
        }));

        // Organize comments into threaded structure
        const topLevelComments = processedInteractions.filter(i => 
          i.interaction_type === 'comment' && !i.parent_comment_id
        );
        
        const replies = processedInteractions.filter(i => 
          i.interaction_type === 'comment' && i.parent_comment_id
        );

        // Attach replies to their parent comments
        const commentsWithReplies = topLevelComments.map(comment => ({
          ...comment,
          replies: replies.filter(reply => reply.parent_comment_id === comment.id)
        }));

        setInteractions(commentsWithReplies);
        
        // Count likes and check if user liked
        const likes = processedInteractions.filter(i => i.interaction_type === 'like');
        setLikesCount(likes.length);
        setUserLiked(user ? likes.some(like => like.user_id === user.id) : false);
      } else {
        setInteractions([]);
        setLikesCount(0);
        setUserLiked(false);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [contentId, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like content');
      return;
    }

    setLoading(true);
    try {
      if (userLiked) {
        // Remove like
        const { error } = await supabase
          .from('content_interactions')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;
        
        setUserLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Add like
        const { error } = await supabase
          .from('content_interactions')
          .insert({
            content_id: contentId,
            user_id: user.id,
            interaction_type: 'like'
          });

        if (error) throw error;
        
        setUserLiked(true);
        setLikesCount(prev => prev + 1);
      }

      onInteractionChange?.();
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (parentCommentId?: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    const text = parentCommentId ? replyTexts[parentCommentId] : commentText;
    if (!text || !text.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('content_interactions')
        .insert({
          content_id: contentId,
          user_id: user.id,
          interaction_type: 'comment',
          comment_text: text.trim(),
          parent_comment_id: parentCommentId || null
        });

      if (error) throw error;

      if (parentCommentId) {
        setReplyTexts(prev => ({ ...prev, [parentCommentId]: "" }));
        setReplyingTo(null);
      } else {
        setCommentText("");
      }
      
      await fetchInteractions();
      onInteractionChange?.();
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCommentsCount = () => {
    return interactions.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  const handleReplyTextChange = (commentId: string, value: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: value }));
  };

  const renderComment = (comment: Interaction, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
          {comment.user.display_name?.[0] || comment.user.username[0] || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.user.display_name || comment.user.username}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{comment.comment_text}</p>
          
          {!isReply && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyTexts[comment.id] || ""}
                onChange={(e) => handleReplyTextChange(comment.id, e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => handleComment(comment.id)}
                  disabled={loading || !replyTexts[comment.id]?.trim()}
                  size="sm"
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyTexts(prev => ({ ...prev, [comment.id]: "" }));
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Like and Comment buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={loading}
          className={`gap-1 ${userLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`w-4 h-4 ${userLiked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-1"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{getTotalCommentsCount()}</span>
        </Button>
      </div>

      {/* Comment input */}
      {user && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={() => handleComment()}
            disabled={loading || !commentText.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Comments list */}
      {showComments && interactions.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {interactions.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default ContentInteractions;
