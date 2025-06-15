
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Heart, ChevronDown, ChevronUp, X } from "lucide-react";
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
  parent_comment_id: string | null;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  replies: Comment[];
}

const StreamChat = ({ streamId }: StreamChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
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
      // Get all comments for this stream
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
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        // Process comments and organize them hierarchically
        const allComments: Comment[] = commentsData.map(comment => ({
          id: comment.id,
          comment: comment.comment,
          created_at: comment.created_at,
          user_id: comment.user_id,
          parent_comment_id: comment.parent_comment_id,
          username: profilesMap.get(comment.user_id)?.username,
          display_name: profilesMap.get(comment.user_id)?.display_name,
          avatar_url: profilesMap.get(comment.user_id)?.avatar_url,
          replies: []
        }));

        // Organize comments into hierarchy
        const topLevelComments: Comment[] = [];
        const commentsMap = new Map(allComments.map(comment => [comment.id, comment]));

        allComments.forEach(comment => {
          if (comment.parent_comment_id) {
            // This is a reply
            const parentComment = commentsMap.get(comment.parent_comment_id);
            if (parentComment) {
              parentComment.replies.push(comment);
            }
          } else {
            // This is a top-level comment
            topLevelComments.push(comment);
          }
        });

        setComments(topLevelComments);
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
        async () => {
          // Refetch all comments to maintain hierarchy
          await fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send comments",
        variant: "destructive",
      });
      return;
    }

    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const insertData: any = {
        stream_id: streamId,
        user_id: user.id,
        comment: text.trim()
      };

      if (parentId) {
        insertData.parent_comment_id = parentId;
      }

      const { error } = await supabase
        .from('stream_comments')
        .insert(insertData);

      if (error) throw error;
      
      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      
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

  const toggleRepliesVisibility = (commentId: string) => {
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment: Comment, depth = 0): JSX.Element => {
    const isCollapsed = collapsedReplies.has(comment.id);
    const hasReplies = comment.replies.length > 0;
    
    return (
      <div key={comment.id} className={depth > 0 ? "ml-4 mt-2" : ""}>
        <div className="text-sm mb-2">
          <div className="flex items-start gap-2">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={comment.avatar_url || ""} />
              <AvatarFallback className="bg-gray-600 text-white text-xs">
                {comment.display_name?.[0]?.toUpperCase() || 
                 comment.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-primary text-xs">
                  {comment.display_name || comment.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(comment.created_at)}
                </span>
              </div>
              <p className="text-gray-700 break-words text-sm mb-1">{comment.comment}</p>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-gray-400 hover:text-primary text-xs p-0 h-auto"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRepliesVisibility(comment.id)}
                    className="text-blue-400 hover:text-blue-600 text-xs p-0 h-auto flex items-center"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-3 h-3 mr-1" />
                    ) : (
                      <ChevronUp className="w-3 h-3 mr-1" />
                    )}
                    {isCollapsed ? `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}` : `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                  </Button>
                )}
              </div>

              {/* Reply input for this specific comment */}
              {replyingTo === comment.id && (
                <div className="mt-2 flex items-start space-x-2">
                  <Avatar className="w-5 h-5 flex-shrink-0">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                      {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 
                       user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center space-x-1">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="text-xs h-8"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment(e, comment.id);
                        }
                      }}
                    />
                    <Button
                      onClick={(e) => handleSendComment(e, comment.id)}
                      disabled={!replyText.trim() || loading}
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-600 p-1 h-8"
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
                      className="text-gray-400 hover:text-gray-600 p-1 h-8"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Render replies with increased depth */}
        {hasReplies && !isCollapsed && (
          <div className="mt-1 border-l-2 border-gray-200 pl-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
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
            {comments.map((comment) => renderComment(comment))}
            {comments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <form onSubmit={(e) => handleSendComment(e)} className="flex gap-2">
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
