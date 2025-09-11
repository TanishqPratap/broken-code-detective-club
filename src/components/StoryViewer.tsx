
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Music, Volume2, VolumeX, Share } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Story = Tables<"stories"> & {
  creator_name: string;
  creator_avatar: string;
};

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

interface StoryElement {
  id: string;
  type: 'sticker' | 'text' | 'gif' | 'music';
  content: string;
  position: { x: number; y: number };
  style?: any;
}

interface StoryMetadata {
  elements?: StoryElement[];
  textOverlay?: string;
  hasDrawing?: boolean;
}

const StoryViewer = ({ stories, initialIndex = 0, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const currentStory = stories[currentIndex];
  const duration = currentStory?.content_type === 'video' ? 15000 : 5000;

  const getStoryMetadata = (story: Story): StoryMetadata => {
    try {
      return story.text_overlay ? JSON.parse(story.text_overlay) : {};
    } catch {
      return { textOverlay: story.text_overlay };
    }
  };

  const storyMetadata = currentStory ? getStoryMetadata(currentStory) : {};

  const startProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (duration / 100));
        if (newProgress >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return newProgress;
      });
    }, 100);
  };

  const pauseProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeProgress = () => {
    setIsPaused(false);
    startProgress();
  };

  useEffect(() => {
    if (!currentStory || isPaused) return;
    
    setProgress(0);
    startProgress();

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [currentIndex, currentStory, duration, stories.length, onClose, isPaused]);

  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user || !currentStory) return;

      try {
        const { data, error } = await supabase
          .from('story_likes')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!data);
      } catch (error) {
        setIsLiked(false);
      }
    };

    checkIfLiked();
  }, [currentIndex, user, currentStory]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Prevent zoom on mobile
    if (isMobile) {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      if (isMobile) {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1');
        }
      }
    };
  }, [isMobile]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleLike = async () => {
    if (!user || !currentStory || isLiking) return;

    try {
      setIsLiking(true);
      
      if (isLiked) {
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', currentStory.id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setIsLiked(false);
        toast.success("Story unliked!");
      } else {
        const { error } = await supabase
          .from('story_likes')
          .insert({
            story_id: currentStory.id,
            user_id: user.id
          });

        if (error) throw error;
        
        setIsLiked(true);
        toast.success("Story liked!");
      }
      
    } catch (error) {
      console.error('Error liking/unliking story:', error);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: `${currentStory.creator_name}'s Story`,
          text: 'Check out this story!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    pauseProgress();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Determine if it's a swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    } else if (Math.abs(deltaY) > 100) {
      if (deltaY > 0) {
        onClose(); // Swipe down to close
      }
    } else {
      // Tap behavior
      const screenWidth = window.innerWidth;
      if (touch.clientX < screenWidth / 3) {
        goToPrevious();
      } else if (touch.clientX > (screenWidth * 2) / 3) {
        goToNext();
      } else {
        // Center tap - toggle pause/play
        if (isPaused) {
          resumeProgress();
        } else {
          pauseProgress();
        }
      }
    }
    
    setTouchStart(null);
    if (!isPaused) {
      resumeProgress();
    }
  };

  if (!currentStory) return null;

  return createPortal(
    <div 
      className="fixed inset-0 w-full h-full bg-black z-[9999] flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#000000',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className={`absolute ${isMobile ? 'top-safe-4' : 'top-4'} left-4 right-4 flex gap-1 z-30`}>
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded">
            <div
              className="h-full bg-white rounded transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className={`absolute ${isMobile ? 'top-safe-12' : 'top-8'} left-4 right-4 flex items-center justify-between z-30`}>
        <div className="flex items-center gap-3">
          <Avatar className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'}`}>
            <AvatarImage src={currentStory.creator_avatar} />
            <AvatarFallback>{currentStory.creator_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className={`text-white font-semibold ${isMobile ? 'text-base' : 'text-sm'}`}>
              {currentStory.creator_name}
            </span>
            <span className={`text-white/70 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              {new Date(currentStory.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {storyMetadata.elements?.some(e => e.type === 'music') && (
            <Button 
              variant="ghost" 
              size={isMobile ? "default" : "sm"}
              onClick={() => setIsMuted(!isMuted)} 
              className="text-white hover:bg-white/20 touch-manipulation"
            >
              {isMuted ? <VolumeX className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} /> : <Volume2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size={isMobile ? "default" : "sm"} 
            onClick={handleShare} 
            className="text-white hover:bg-white/20 touch-manipulation"
          >
            <Share className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          </Button>
          <Button 
            variant="ghost" 
            size={isMobile ? "default" : "sm"} 
            onClick={onClose} 
            className="text-white hover:bg-white/20 touch-manipulation"
          >
            <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div className={`relative w-full h-full ${isMobile ? '' : 'max-w-md mx-auto'} flex items-center justify-center`}>
        {currentStory.content_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
            draggable={false}
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            controls={false}
          />
        )}

        {/* Story elements overlay */}
        {storyMetadata.elements?.map(element => (
          <div
            key={element.id}
            className="absolute z-10 pointer-events-none"
            style={{
              left: element.position.x,
              top: element.position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {element.type === 'sticker' && (
              <span className={`${isMobile ? 'text-5xl' : 'text-4xl'} drop-shadow-lg animate-bounce`}>
                {element.content}
              </span>
            )}
            {element.type === 'text' && (
              <span 
                style={{
                  color: element.style?.color || '#ffffff',
                  fontSize: isMobile ? '18px' : (element.style?.fontSize || 16) + 'px',
                  fontWeight: element.style?.fontWeight || 'normal',
                  backgroundColor: element.style?.backgroundColor || 'transparent'
                }}
                className="px-3 py-2 rounded drop-shadow-lg font-bold"
              >
                {element.content}
              </span>
            )}
            {element.type === 'gif' && (
              <img 
                src={element.content} 
                alt="GIF" 
                className={`${isMobile ? 'w-24 h-24' : 'w-20 h-20'} object-cover rounded drop-shadow-lg`} 
              />
            )}
          </div>
        ))}

        {/* Music indicator */}
        {storyMetadata.elements?.some(e => e.type === 'music') && (
          <div className={`absolute ${isMobile ? 'top-24 right-4' : 'top-20 right-4'} z-10`}>
            <div className={`bg-black/50 text-white px-3 py-2 rounded-full ${isMobile ? 'text-base' : 'text-sm'} flex items-center gap-2 backdrop-blur-sm`}>
              <Music className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} animate-pulse`} />
              <span>♪ Music</span>
            </div>
          </div>
        )}

        {/* Caption/Text overlay */}
        {storyMetadata.textOverlay && (
          <div className={`absolute ${isMobile ? 'bottom-safe-32' : 'bottom-24'} left-4 right-4 z-20`}>
            <p className={`text-white ${isMobile ? 'text-xl' : 'text-lg'} font-medium text-center drop-shadow-lg px-4 py-3 bg-black/50 rounded-lg backdrop-blur-sm`}>
              {storyMetadata.textOverlay}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className={`absolute ${isMobile ? 'bottom-safe-16' : 'bottom-8'} left-1/2 transform -translate-x-1/2 flex gap-6 z-20`}>
          <Button 
            variant="ghost" 
            size="lg" 
            className={`text-white hover:bg-white/20 transition-colors ${isMobile ? 'p-6' : 'p-4'} rounded-full touch-manipulation ${isLiked ? 'text-red-500' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={isLiking}
          >
            <Heart className={`${isMobile ? 'w-8 h-8' : 'w-7 h-7'} ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className={`text-white hover:bg-white/20 ${isMobile ? 'p-6' : 'p-4'} rounded-full touch-manipulation`}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className={`${isMobile ? 'w-8 h-8' : 'w-7 h-7'}`} />
          </Button>
        </div>

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center z-25">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Paused
            </div>
          </div>
        )}
      </div>

      {/* Desktop navigation arrows */}
      {!isMobile && (
        <>
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-30"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          {currentIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-30"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </>
      )}

      <style>{`
        .top-safe-4 {
          top: calc(env(safe-area-inset-top) + 1rem);
        }
        .top-safe-12 {
          top: calc(env(safe-area-inset-top) + 3rem);
        }
        .bottom-safe-16 {
          bottom: calc(env(safe-area-inset-bottom) + 4rem);
        }
        .bottom-safe-32 {
          bottom: calc(env(safe-area-inset-bottom) + 8rem);
        }
      `}</style>
    </div>,
    document.body
  );
};

export default StoryViewer;
