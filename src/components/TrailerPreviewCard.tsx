
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Star, UserPlus, Eye, Heart, MessageCircle, Share, Send } from "lucide-react";
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

interface TrailerPreviewCardProps {
  trailer: {
    id: string;
    title: string;
    description: string | null;
    content_type: string;
    media_url: string;
    order_position: number;
    created_at: string;
    creator: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      is_verified: boolean;
      subscription_price: number | null;
    };
  };
}

const TrailerPreviewCard = ({ trailer }: TrailerPreviewCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikesAndComments();
  }, [trailer.id, user]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, trailer.id]);

  const fetchLikesAndComments = async () => {
    try {
      // Fetch likes count
      const { count: likesCountData, error: likesError } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', trailer.id)
        .eq('interaction_type', 'like');

      if (likesError) throw likesError;
      setLikesCount(likesCountData || 0);

      // Check if current user liked this trailer
      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('posts_interactions')
          .select('id')
          .eq('post_id', trailer.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .maybeSingle();

        if (userLikeError) throw userLikeError;
        setIsLiked(!!userLike);
      }

      // Fetch comments count
      const { count: commentsCountData, error: commentsError } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', trailer.id)
        .eq('interaction_type', 'comment');

      if (commentsError) throw commentsError;
      setCommentsCount(commentsCountData || 0);
    } catch (error) {
      console.error('Error fetching likes and comments:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('posts_interactions')
        .select('id, user_id, comment_text, created_at')
        .eq('post_id', trailer.id)
        .eq('interaction_type', 'comment')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        profilesData?.map(profile => [profile.id, profile]) || []
      );

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

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like trailers");
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('posts_interactions')
          .delete()
          .eq('post_id', trailer.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('posts_interactions')
          .insert({
            post_id: trailer.id,
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
          post_id: trailer.id,
          user_id: user.id,
          interaction_type: 'comment',
          comment_text: commentText.trim()
        });

      if (error) throw error;

      setCommentText("");
      setCommentsCount(prev => prev + 1);
      
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
      title: `Check out this trailer by ${trailer.creator.display_name || trailer.creator.username}`,
      text: trailer.description || `Amazing trailer content from ${trailer.creator.display_name || trailer.creator.username}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Trailer shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to share trailer");
    }
  };

  const handleCreatorClick = () => {
    navigate(`/creator/${trailer.creator.id}`);
  };

  const handlePreviewClick = () => {
    if (trailer.content_type === 'video') {
      setIsPlaying(!isPlaying);
    } else {
      navigate(`/creator/${trailer.creator.id}`);
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
            onClick={handleCreatorClick}
          >
            <Avatar>
              <AvatarImage src={trailer.creator.avatar_url || ''} />
              <AvatarFallback>
                {trailer.creator.display_name?.[0] || trailer.creator.username?.[0] || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  {trailer.creator.display_name || trailer.creator.username}
                </h4>
                {trailer.creator.is_verified && (
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{trailer.creator.username}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Free Preview
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4">
          <h3 className="font-medium mb-2">{trailer.title}</h3>
          {trailer.description && (
            <p className="text-sm text-muted-foreground mb-3">{trailer.description}</p>
          )}
        </div>

        <div className="relative rounded-lg overflow-hidden">
          <AspectRatio ratio={16/9}>
            <div 
              className="w-full h-full bg-muted cursor-pointer group relative"
              onClick={handlePreviewClick}
            >
              {trailer.content_type === 'video' ? (
                <>
                  {isPlaying ? (
                    <video
                      src={trailer.media_url}
                      className="w-full h-full object-contain bg-black"
                      controls
                      autoPlay
                    />
                  ) : (
                    <>
                      <video
                        src={trailer.media_url}
                        className="w-full h-full object-contain bg-black"
                        muted
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                        <div className="bg-white bg-opacity-90 rounded-full p-3">
                          <Play className="w-6 h-6 text-black fill-current" />
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <img
                    src={trailer.media_url}
                    alt={trailer.title}
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-3">
                      <Eye className="w-6 h-6 text-black" />
                    </div>
                  </div>
                </>
              )}
              
              <Badge className="absolute top-3 left-3 bg-purple-600">
                Trailer {trailer.order_position}
              </Badge>
            </div>
          </AspectRatio>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t mt-4">
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
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {formatTimeAgo(trailer.created_at)}
            </div>
            {trailer.creator.subscription_price && (
              <span className="text-sm font-medium text-green-600">
                ${trailer.creator.subscription_price}/month
              </span>
            )}
            <Button size="sm" onClick={handleCreatorClick}>
              <UserPlus className="w-4 h-4 mr-1" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4 border-t pt-4">
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

export default TrailerPreviewCard;
