
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send } from "lucide-react";
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
  created_at: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const ContentInteractions = ({ contentId, onInteractionChange }: ContentInteractionsProps) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchInteractions = async () => {
    try {
      const { data: interactionsData, error } = await supabase
        .from('content_interactions')
        .select(`
          id,
          user_id,
          interaction_type,
          comment_text,
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

        const processedInteractions = interactionsData.map(interaction => ({
          ...interaction,
          user: profilesMap.get(interaction.user_id) || {
            username: 'Unknown User',
            display_name: null,
            avatar_url: null
          }
        }));

        setInteractions(processedInteractions);
        
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

  const handleComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!commentText.trim()) {
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
          comment_text: commentText.trim()
        });

      if (error) throw error;

      setCommentText("");
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

  const comments = interactions.filter(i => i.interaction_type === 'comment');

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
          <span>{comments.length}</span>
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
            onClick={handleComment}
            disabled={loading || !commentText.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Comments list */}
      {showComments && comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
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
                <p className="text-sm text-gray-700">{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentInteractions;
