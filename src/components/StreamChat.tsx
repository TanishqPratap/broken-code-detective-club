
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StreamChatProps {
  streamId: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  username?: string;
  display_name?: string;
}

const StreamChat = ({ streamId }: StreamChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
    const cleanup = subscribeToComments();
    return cleanup;
  }, [streamId]);

  useEffect(() => {
    // Auto-scroll to bottom when new comments arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('stream_comments')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Get user profiles for the comments
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds);

        // Merge comments with profile data
        const commentsWithProfiles = commentsData.map(comment => {
          const profile = profilesData?.find(p => p.id === comment.user_id);
          return {
            ...comment,
            username: profile?.username,
            display_name: profile?.display_name
          };
        });

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`stream-comments-${streamId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_comments',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          // Fetch the user profile for the new comment
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', payload.new.user_id)
            .single();

          const newComment = {
            ...payload.new,
            username: profile?.username,
            display_name: profile?.display_name
          } as Comment;

          setComments(prev => [...prev, newComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send comments",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stream_comments')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          comment: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment("");
      toast({
        title: "Comment sent",
        description: "Your comment has been posted",
      });
    } catch (error: any) {
      console.error('Error sending comment:', error);
      toast({
        title: "Error",
        description: "Failed to send comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 p-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-primary">
                    {comment.display_name || comment.username || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 break-words">{comment.comment}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSendComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Type a message..." : "Sign in to chat"}
              disabled={!user || loading}
              maxLength={500}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!user || loading || !newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamChat;
