import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { toast } from "sonner";
import VibesComments from "@/components/VibesComments";
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts"> & {
  creator_name: string;
  creator_avatar: string;
  creator_username: string;
  likes_count: number;
  user_liked: boolean;
  comments_count: number;
  user_subscribed: boolean;
  subscription_price: number;
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch gesture states
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
          .select('id, username, display_name, avatar_url, subscription_price')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

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

        // Check subscriptions if user is logged in
        let subscriptionsData: any[] = [];
        if (user) {
          const { data: subsData, error: subsError } = await supabase
            .from('subscriptions')
            .select('creator_id')
            .eq('subscriber_id', user.id)
            .eq('status', 'active')
            .in('creator_id', userIds);

          if (subsError) throw subsError;
          subscriptionsData = subsData || [];
        }

        const processedVibes: Post[] = vibesData.map(vibe => {
          const profile = profilesMap.get(vibe.user_id);
          const vibeLikes = likesData?.filter(like => like.post_id === vibe.id) || [];
          const vibeComments = commentsData?.filter(comment => comment.post_id === vibe.id) || [];
          const isSubscribed = subscriptionsData.some(sub => sub.creator_id === vibe.user_id);

          return {
            ...vibe,
            creator_name: profile?.display_name || profile?.username || 'Unknown',
            creator_avatar: profile?.avatar_url || '',
            creator_username: profile?.username || 'unknown',
            likes_count: vibeLikes.length,
            user_liked: user ? vibeLikes.some(like => like.user_id === user.id) : false,
            comments_count: vibeComments.length,
            user_subscribed: isSubscribed,
            subscription_price: profile?.subscription_price || 0
          };
        });

        setVibes(processedVibes);
        
        // Setup audio for each vibe
        setTimeout(() => {
          processedVibes.forEach((vibe, index) => {
            setupAudioForVibe(vibe, index);
          });
        }, 100);
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

  const setupAudioForVibe = (vibe: Post, index: number) => {
    // Clean up existing audio
    if (audioRefs.current[index]) {
      audioRefs.current[index]!.pause();
      audioRefs.current[index] = null;
    }

    // Check if vibe has music with preview URL
    if (vibe.metadata && 
        typeof vibe.metadata === 'object' && 
        'effects' in vibe.metadata) {
      const effects = vibe.metadata.effects as any;
      if (effects?.music?.preview_url) {
        console.log(`Setting up audio for vibe ${index}:`, effects.music.name);
        const audio = new Audio(effects.music.preview_url);
        audio.volume = 0.7;
        audio.loop = true;
        audio.muted = isMuted;
        
        // Handle audio events
        audio.addEventListener('canplay', () => {
          console.log(`Audio ready for vibe ${index}`);
        });
        
        audio.addEventListener('error', (e) => {
          console.error(`Audio error for vibe ${index}:`, e);
        });

        audioRefs.current[index] = audio;
      }
    }
  };

  useEffect(() => {
    fetchVibes();
  }, [user]);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    const currentAudio = audioRefs.current[currentIndex];
    
    if (currentVideo) {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex && isPlaying) {
            video.play().catch(console.error);
            // Play audio if available and sync with video
            if (audioRefs.current[index]) {
              const audio = audioRefs.current[index];
              if (audio) {
                audio.currentTime = video.currentTime;
                audio.muted = isMuted;
                audio.play().catch(console.error);
              }
            }
          } else {
            video.pause();
            // Pause audio
            if (audioRefs.current[index]) {
              audioRefs.current[index]!.pause();
            }
          }
        }
      });
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.muted = isMuted;
      }
    });
    
    audioRefs.current.forEach((audio, index) => {
      if (audio) {
        audio.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Handle touch gestures for mobile scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't interfere with button clicks
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't interfere with button clicks
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    // Only prevent default for swipe gestures, not button interactions
    if (touchStartY) {
      e.preventDefault();
      setTouchEndY(e.targetTouches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Don't interfere with button clicks
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    if (!touchStartY || !touchEndY) return;
    
    const distance = touchStartY - touchEndY;
    const minSwipeDistance = 80;
    
    if (distance > minSwipeDistance && currentIndex < vibes.length - 1) {
      handleVibeChange(currentIndex + 1);
    } else if (distance < -minSwipeDistance && currentIndex > 0) {
      handleVibeChange(currentIndex - 1);
    }
    
    setTouchStartY(0);
    setTouchEndY(0);
  };

  const handleVibeChange = (newIndex: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isTransitioning) return;
      
      if (e.deltaY > 0 && currentIndex < vibes.length - 1) {
        handleVibeChange(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        handleVibeChange(currentIndex - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      if (e.key === 'ArrowDown' && currentIndex < vibes.length - 1) {
        handleVibeChange(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        handleVibeChange(currentIndex - 1);
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
  }, [currentIndex, vibes.length, isPlaying, isTransitioning]);

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
        vibe.id === vibeId ? {
          ...vibe,
          user_liked: !currentlyLiked,
          likes_count: currentlyLiked ? vibe.likes_count - 1 : vibe.likes_count + 1
        } : vibe
      ));
    } catch (error) {
      console.error('Error liking vibe:', error);
      toast.error('Failed to like vibe');
    }
  };

  const handleSubscribe = async (creatorId: string, creatorName: string, subscriptionPrice: number, currentlySubscribed: boolean) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (currentlySubscribed) {
      // Handle unsubscribe
      try {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('creator_id', creatorId)
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        toast.success('Unsubscribed successfully');
        
        // Update the local state
        setVibes(prev => prev.map(vibe => 
          vibe.user_id === creatorId ? {
            ...vibe,
            user_subscribed: false
          } : vibe
        ));
      } catch (error) {
        console.error('Error unsubscribing:', error);
        toast.error('Failed to unsubscribe');
      }
    } else {
      // Handle subscribe with payment
      if (subscriptionPrice > 0) {
        setSelectedCreator({
          id: creatorId,
          name: creatorName,
          price: subscriptionPrice
        });
        setShowSubscriptionModal(true);
      } else {
        // Free subscription
        try {
          await supabase
            .from('subscriptions')
            .insert({
              creator_id: creatorId,
              subscriber_id: user.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
          
          toast.success('Subscribed successfully');
          
          // Update the local state
          setVibes(prev => prev.map(vibe => 
            vibe.user_id === creatorId ? {
              ...vibe,
              user_subscribed: true
            } : vibe
          ));
        } catch (error) {
          console.error('Error subscribing:', error);
          toast.error('Failed to subscribe');
        }
      }
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    if (selectedCreator) {
      // Update the local state
      setVibes(prev => prev.map(vibe => 
        vibe.user_id === selectedCreator.id ? {
          ...vibe,
          user_subscribed: true
        } : vibe
      ));
      toast.success(`Successfully subscribed to ${selectedCreator.name}`);
    }
    setSelectedCreator(null);
  };

  const handleShare = async (vibe: Post) => {
    const shareUrl = `${window.location.origin}/vibes?id=${vibe.id}`;
    const shareText = `Check out this vibe by ${vibe.creator_name}: ${vibe.description || 'Amazing content!'}`;

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: `Vibe by ${vibe.creator_name}`,
          text: shareText,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback - try to copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast.error('Failed to share. Please copy the URL manually.');
      }
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

  const syncAudioWithVideo = (videoIndex: number) => {
    const video = videoRefs.current[videoIndex];
    const audio = audioRefs.current[videoIndex];
    
    if (video && audio && videoIndex === currentIndex && isPlaying) {
      // Keep audio in sync with video
      const timeDiff = Math.abs(audio.currentTime - video.currentTime);
      if (timeDiff > 0.1) { // Only sync if difference is significant
        audio.currentTime = video.currentTime;
      }
    }
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
        className="h-screen bg-black relative overflow-hidden touch-none"
        style={{ height: '100dvh' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile-first design container - Full screen on mobile */}
        <div className="w-full h-full relative">
          {/* Progress indicators */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-1">
            {vibes.map((_, index) => (
              <div
                key={index}
                className={`w-0.5 h-4 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={() => !isTransitioning && handleVibeChange(index)}
              />
            ))}
          </div>

          {/* Video container with smooth scrolling */}
          <div className="relative h-full overflow-hidden">
            {vibes.map((vibe, index) => (
              <div
                key={vibe.id}
                className={`absolute inset-0 transition-all duration-300 ease-out ${
                  index === currentIndex
                    ? 'translate-y-0 opacity-100 scale-100'
                    : index < currentIndex
                    ? '-translate-y-full opacity-0 scale-95'
                    : 'translate-y-full opacity-0 scale-95'
                }`}
                style={{
                  transform: `translateY(${(index - currentIndex) * 100}%) scale(${index === currentIndex ? 1 : 0.95})`,
                }}
              >
                {/* Video */}
                {vibe.media_url && (
                  <video
                    ref={el => {
                      videoRefs.current[index] = el;
                      if (el) {
                        el.addEventListener('loadeddata', () => {
                          // Setup audio when video is loaded
                          setupAudioForVibe(vibe, index);
                        });
                      }
                    }}
                    src={vibe.media_url}
                    className="w-full h-full object-cover"
                    style={{ height: '100%', width: '100%' }}
                    loop
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    onClick={togglePlayPause}
                    onTimeUpdate={() => syncAudioWithVideo(index)}
                    onPlay={() => {
                      if (index === currentIndex && audioRefs.current[index]) {
                        const audio = audioRefs.current[index];
                        if (audio) {
                          audio.currentTime = videoRefs.current[index]?.currentTime || 0;
                          audio.play().catch(console.error);
                        }
                      }
                    }}
                    onPause={() => {
                      if (audioRefs.current[index]) {
                        audioRefs.current[index]!.pause();
                      }
                    }}
                  />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Top controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                  <div className="text-white font-semibold text-sm">
                    {/* Could add live indicator or other info here */}
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
                <div className="absolute bottom-20 left-4 right-16 z-10">
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
                        onClick={() => handleSubscribe(vibe.user_id, vibe.creator_name, vibe.subscription_price, vibe.user_subscribed)}
                        className={`text-xs px-2 py-1 h-6 ${
                          vibe.user_subscribed
                            ? 'border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-white bg-transparent'
                            : 'border-white text-white hover:bg-white hover:text-black bg-transparent'
                        }`}
                      >
                        {vibe.user_subscribed ? 'Subscribed' : vibe.subscription_price > 0 ? `Subscribe $${vibe.subscription_price}` : 'Subscribe'}
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
                  {vibe.metadata &&
                    typeof vibe.metadata === 'object' &&
                    'hashtags' in vibe.metadata && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(vibe.metadata.hashtags as string[])?.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-blue-400 text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Music info if available from Spotify */}
                  {vibe.metadata &&
                    typeof vibe.metadata === 'object' &&
                    'effects' in vibe.metadata &&
                    (vibe.metadata.effects as any)?.music && (
                      <div className="flex items-center gap-2 text-white text-xs opacity-90 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 w-fit mb-2">
                        <Music className="w-3 h-3" />
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-40">
                            {(vibe.metadata.effects as any).music.name}
                          </span>
                          <span className="text-gray-300 truncate max-w-40">
                            {(vibe.metadata.effects as any).music.artist}
                          </span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Action buttons - Instagram Reels style on the right */}
                <div className="absolute bottom-20 right-3 flex flex-col gap-4 z-10">
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
                      onClick={() => handleShare(vibe)}
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

          {/* Navigation hint - positioned to avoid bottom nav */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 text-center">
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

      {/* Subscription Payment Modal */}
      {selectedCreator && (
        <SubscriptionPaymentModal
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedCreator(null);
          }}
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.name}
          subscriptionPrice={selectedCreator.price}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  );
};

export default Vibes;
