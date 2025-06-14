
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ArrowLeft, Play, Star, UserPlus, Eye, Heart, MessageCircle, Share, Send } from "lucide-react";
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

interface Trailer {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  order_position: number;
  created_at: string;
  creator_id: string;
}

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  subscription_price: number | null;
}

const TrailerView = () => {
  const { creatorId, trailerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    if (creatorId && trailerId) {
      fetchTrailerAndCreator();
    }
  }, [creatorId, trailerId, user]);

  const fetchTrailerAndCreator = async () => {
    try {
      setLoading(true);
      
      // Fetch trailer
      const { data: trailerData, error: trailerError } = await supabase
        .from('trailer_content')
        .select('*')
        .eq('id', trailerId)
        .eq('creator_id', creatorId)
        .single();

      if (trailerError) throw trailerError;

      // Fetch creator
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, subscription_price')
        .eq('id', creatorId)
        .single();

      if (creatorError) throw creatorError;

      setTrailer(trailerData);
      setCreator(creatorData);

      // Fetch interaction data
      await fetchInteractions();
    } catch (error) {
      console.error('Error fetching trailer:', error);
      toast.error("Failed to load trailer");
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!trailerId) return;

    try {
      // Fetch likes count
      const { count: likesCountData, error: likesError } = await supabase
        .from('trailer_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('trailer_id', trailerId)
        .eq('interaction_type', 'like');

      if (likesError) throw likesError;
      setLikesCount(likesCountData || 0);

      // Check if current user liked this trailer
      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('trailer_interactions')
          .select('id')
          .eq('trailer_id', trailerId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like')
          .maybeSingle();

        if (userLikeError) throw userLikeError;
        setIsLiked(!!userLike);
      }

      // Fetch comments count
      const { count: commentsCountData, error: commentsError } = await supabase
        .from('trailer_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('trailer_id', trailerId)
        .eq('interaction_type', 'comment');

      if (commentsError) throw commentsError;
      setCommentsCount(commentsCountData || 0);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
    toast.error("Please sign in to interact with this trailer");
  };

  const handleLike = async () => {
    if (!user) {
      handleAuthRequired();
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('trailer_interactions')
          .delete()
          .eq('trailer_id', trailerId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('trailer_interactions')
          .insert({
            trailer_id: trailerId,
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
      handleAuthRequired();
      return;
    }

    if (!commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('trailer_interactions')
        .insert({
          trailer_id: trailerId,
          user_id: user.id,
          interaction_type: 'comment',
          comment_text: commentText.trim()
        });

      if (error) throw error;

      setCommentText("");
      setCommentsCount(prev => prev + 1);
      toast.success("Comment added!");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async () => {
    const trailerUrl = `${window.location.origin}/creator/${creatorId}/trailer/${trailerId}`;
    
    try {
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `Check out this trailer by ${creator?.display_name || creator?.username}`,
          text: trailer?.description || `Amazing trailer content from ${creator?.display_name || creator?.username}`,
          url: trailerUrl
        });
        toast.success("Trailer shared successfully!");
      } else {
        await navigator.clipboard.writeText(trailerUrl);
        toast.success("Trailer link copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(trailerUrl);
        toast.success("Trailer link copied to clipboard!");
      } catch (clipboardError) {
        toast.error("Failed to share trailer");
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Loading trailer...</div>
        </div>
      </div>
    );
  }

  if (!trailer || !creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Trailer not found</div>
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
            onClick={() => navigate('/discover')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trailer</h1>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/creator/${creator.id}`)}
              >
                <Avatar>
                  <AvatarImage src={creator.avatar_url || ''} />
                  <AvatarFallback>
                    {creator.display_name?.[0] || creator.username?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {creator.display_name || creator.username}
                    </h4>
                    {creator.is_verified && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{creator.username}</p>
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
                <div className="w-full h-full bg-muted cursor-pointer group relative">
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
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all"
                            onClick={() => setIsPlaying(true)}
                          >
                            <div className="bg-white bg-opacity-90 rounded-full p-3">
                              <Play className="w-6 h-6 text-black fill-current" />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <img
                      src={trailer.media_url}
                      alt={trailer.title}
                      className="w-full h-full object-contain bg-black"
                    />
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
                  onClick={() => user ? setShowComments(!showComments) : handleAuthRequired()}
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
                {creator.subscription_price && (
                  <span className="text-sm font-medium text-green-600">
                    ${creator.subscription_price}/month
                  </span>
                )}
                <Button size="sm" onClick={() => navigate(`/creator/${creator.id}`)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && user && (
              <div className="mt-4 space-y-4 border-t pt-4">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default TrailerView;
