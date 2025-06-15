
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import VibesComments from "@/components/VibesComments";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts"> & {
  creator_name: string;
  creator_avatar: string;
  creator_username: string;
  likes_count: number;
  user_liked: boolean;
  comments_count: number;
};

const Vibes = () => {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [activeVibeId, setActiveVibeId] = useState<string | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchVibes = async () => {
    try {
      setLoading(true);
      
      const { data: vibesData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('content_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (vibesData && vibesData.length > 0) {
        const userIds = [...new Set(vibesData.map(vibe => vibe.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        const vibeIds = vibesData.map(vibe => vibe.id);
        const { data: likesData, error: likesError } = await supabase
          .from('posts_interactions')
          .select('post_id, user_id')
          .in('post_id', vibeIds)
          .eq('interaction_type', 'like');

        if (likesError) throw likesError;

        const { data: commentsData, error: commentsError } = await supabase
          .from('posts_interactions')
          .select('post_id')
          .in('post_id', vibeIds)
          .eq('interaction_type', 'comment');

        if (commentsError) throw commentsError;

        const processedVibes: Post[] = vibesData.map(vibe => {
          const profile = profilesMap.get(vibe.user_id);
          const vibeLikes = likesData?.filter(like => like.post_id === vibe.id) || [];
          const vibeComments = commentsData?.filter(comment => comment.post_id === vibe.id) || [];
          
          return {
            ...vibe,
            creator_name: profile?.display_name || profile?.username || 'Unknown',
            creator_avatar: profile?.avatar_url || '',
            creator_username: profile?.username || 'unknown',
            likes_count: vibeLikes.length,
            user_liked: user ? vibeLikes.some(like => like.user_id === user.id) : false,
            comments_count: vibeComments.length
          };
        });

        setVibes(processedVibes);
      } else {
        setVibes([]);
      }
    } catch (error) {
      console.error('Error fetching vibes:', error);
      toast.error('Failed to load vibes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVibes();
  }, [user]);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex && isPlaying) {
            video.play().catch(console.error);
          } else {
            video.pause();
          }
        }
      });
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 && currentIndex < vibes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < vibes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, vibes.length, isPlaying]);

  const handleLike = async (vibeId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like vibes');
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

      setVibes(prev => prev.map(vibe => 
        vibe.id === vibeId 
          ? { 
              ...vibe, 
              user_liked: !currentlyLiked,
              likes_count: currentlyLiked ? vibe.likes_count - 1 : vibe.likes_count + 1
            }
          : vibe
      ));
    } catch (error) {
      console.error('Error liking vibe:', error);
      toast.error('Failed to like vibe');
    }
  };

  const handleCommentClick = (vibeId: string) => {
    setActiveVibeId(vibeId);
    setShowComments(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading vibes...</div>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No Vibes Yet</h2>
          <p className="text-gray-400">Be the first to create a vibe!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="min-h-screen bg-black relative"
      >
        {/* Mobile-first design container */}
        <div className="max-w-md mx-auto relative min-h-screen">
          {/* Progress indicators */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-1">
            {vibes.map((_, index) => (
              <div
                key={index}
                className={`w-0.5 h-4 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>

          {/* Video container */}
          <div className="relative h-screen overflow-hidden">
            {vibes.map((vibe, index) => (
              <div
                key={vibe.id}
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  index === currentIndex 
                    ? 'translate-y-0 opacity-100' 
                    : index < currentIndex 
                      ? '-translate-y-full opacity-0' 
                      : 'translate-y-full opacity-0'
                }`}
              >
                {/* Video */}
                {vibe.media_url && (
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={vibe.media_url}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    onClick={togglePlayPause}
                  />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Top controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                  <div className="text-white font-semibold text-sm">
                    Reels
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20 p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Creator info and caption - positioned like Instagram */}
                <div className="absolute bottom-16 left-4 right-16 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-8 h-8 border border-white">
                      <AvatarImage src={vibe.creator_avatar} />
                      <AvatarFallback className="bg-gray-600 text-white text-sm">
                        {vibe.creator_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{vibe.creator_username}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white text-white hover:bg-white hover:text-black bg-transparent text-xs px-2 py-1 h-6"
                      >
                        Subscribe
                      </Button>
                    </div>
                  </div>

                  {/* Caption */}
                  {vibe.description && (
                    <p className="text-white text-sm mb-1 leading-relaxed">
                      {vibe.description.length > 100 
                        ? `${vibe.description.substring(0, 100)}...` 
                        : vibe.description}
                    </p>
                  )}

                  {/* Hashtags from metadata */}
                  {vibe.metadata && typeof vibe.metadata === 'object' && 'hashtags' in vibe.metadata && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(vibe.metadata.hashtags as string[])?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-blue-400 text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Music info if available */}
                  {vibe.metadata && typeof vibe.metadata === 'object' && 'effects' in vibe.metadata && 
                   (vibe.metadata.effects as any)?.music && (
                    <div className="flex items-center gap-1 text-white text-xs opacity-90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 w-fit">
                      <span>♪</span>
                      <span className="truncate max-w-32">
                        {String((vibe.metadata.effects as any).music)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons - Instagram Reels style on the right */}
                <div className="absolute bottom-16 right-3 flex flex-col gap-4 z-10">
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(vibe.id, vibe.user_liked)}
                      className="text-white hover:bg-white/20 p-2 rounded-full bg-transparent"
                    >
                      <Heart className={`w-6 h-6 ${vibe.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <span className="text-white text-xs font-medium">
                      {vibe.likes_count > 0 ? vibe.likes_count : ''}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCommentClick(vibe.id)}
                      className="text-white hover:bg-white/20 p-2 rounded-full bg-transparent"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                    <span className="text-white text-xs font-medium">
                      {vibe.comments_count > 0 ? vibe.comments_count : ''}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 rounded-full bg-transparent"
                    >
                      <Share2 className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 rounded-full bg-transparent"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation hint */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 text-center">
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs opacity-70">
              Swipe up for next • Tap to pause
            </div>
          </div>
        </div>
      </div>

      {/* Comments Panel */}
      <VibesComments
        vibeId={activeVibeId || ''}
        isOpen={showComments}
        onClose={() => {
          setShowComments(false);
          setActiveVibeId(null);
        }}
      />
    </>
  );
};

export default Vibes;
