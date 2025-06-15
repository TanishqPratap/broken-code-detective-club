
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts"> & {
  creator_name: string;
  creator_avatar: string;
  creator_username: string;
  likes_count: number;
  user_liked: boolean;
};

const Vibes = () => {
  const { user } = useAuth();
  const [vibes, setVibes] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchVibes = async () => {
    try {
      setLoading(true);
      
      // Get reels/vibes content
      const { data: vibesData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('content_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (vibesData && vibesData.length > 0) {
        // Get user profiles for vibes
        const userIds = [...new Set(vibesData.map(vibe => vibe.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        // Get likes for each vibe
        const vibeIds = vibesData.map(vibe => vibe.id);
        const { data: likesData, error: likesError } = await supabase
          .from('posts_interactions')
          .select('post_id, user_id')
          .in('post_id', vibeIds)
          .eq('interaction_type', 'like');

        if (likesError) throw likesError;

        // Process vibes with creator info and likes
        const processedVibes: Post[] = vibesData.map(vibe => {
          const profile = profilesMap.get(vibe.user_id);
          const vibeLikes = likesData?.filter(like => like.post_id === vibe.id) || [];
          
          return {
            ...vibe,
            creator_name: profile?.display_name || profile?.username || 'Unknown',
            creator_avatar: profile?.avatar_url || '',
            creator_username: profile?.username || 'unknown',
            likes_count: vibeLikes.length,
            user_liked: user ? vibeLikes.some(like => like.user_id === user.id) : false
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

  // Handle video play/pause when scrolling
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

  // Mute/unmute all videos
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < vibes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

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

      // Update local state
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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-white">Loading vibes...</div>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No Vibes Yet</h2>
          <p className="text-gray-400">Be the first to create a vibe!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-black relative overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* Navigation buttons */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-20 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleScroll('up')}
          disabled={currentIndex === 0}
          className="text-white hover:bg-white/20"
        >
          ↑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleScroll('down')}
          disabled={currentIndex === vibes.length - 1}
          className="text-white hover:bg-white/20"
        >
          ↓
        </Button>
      </div>

      {vibes.map((vibe, index) => (
        <div
          key={vibe.id}
          className={`absolute inset-0 transition-transform duration-300 ${
            index === currentIndex 
              ? 'translate-y-0' 
              : index < currentIndex 
                ? '-translate-y-full' 
                : 'translate-y-full'
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
            />
          )}

          {/* Overlay UI */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20">
            {/* Top controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 p-2 rounded-full"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20 p-2 rounded-full"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>

            {/* Creator info and actions */}
            <div className="absolute bottom-20 left-4 right-20">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage src={vibe.creator_avatar} />
                  <AvatarFallback className="bg-gray-600 text-white">
                    {vibe.creator_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{vibe.creator_name}</p>
                  <p className="text-gray-300 text-sm">@{vibe.creator_username}</p>
                </div>
              </div>

              {/* Caption */}
              {vibe.description && (
                <p className="text-white text-sm mb-2 leading-relaxed">
                  {vibe.description}
                </p>
              )}

              {/* Music info if available */}
              {vibe.metadata && typeof vibe.metadata === 'object' && 'music' in vibe.metadata && (
                <div className="flex items-center gap-2 text-white text-xs opacity-80">
                  <span>♪</span>
                  <span>{String(vibe.metadata.music)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-20 right-4 flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(vibe.id, vibe.user_liked)}
                className="text-white hover:bg-white/20 p-3 rounded-full flex flex-col items-center"
              >
                <Heart className={`w-7 h-7 ${vibe.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-xs mt-1">{vibe.likes_count}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <MessageCircle className="w-7 h-7" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <Share2 className="w-7 h-7" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <MoreHorizontal className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Scroll indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
        <div className="flex flex-col gap-1">
          {vibes.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vibes;
