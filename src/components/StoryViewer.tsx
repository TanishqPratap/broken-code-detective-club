
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Music, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [isMuted, setIsMuted] = useState(true);
  const { user } = useAuth();

  const currentStory = stories[currentIndex];
  const duration = currentStory?.content_type === 'video' ? 15000 : 5000;

  // Parse story metadata
  const getStoryMetadata = (story: Story): StoryMetadata => {
    try {
      return story.text_overlay ? JSON.parse(story.text_overlay) : {};
    } catch {
      return { textOverlay: story.text_overlay };
    }
  };

  const storyMetadata = currentStory ? getStoryMetadata(currentStory) : {};

  useEffect(() => {
    if (!currentStory) return;

    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, [currentIndex, currentStory, duration, stories.length, onClose]);

  // Check if current story is liked when story changes
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

  // Prevent body scroll when story viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
        backgroundColor: '#000000'
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
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
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentStory.creator_avatar} />
            <AvatarFallback>{currentStory.creator_name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold text-sm">{currentStory.creator_name}</span>
          <span className="text-white/70 text-xs">
            {new Date(currentStory.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {storyMetadata.elements?.some(e => e.type === 'music') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMuted(!isMuted)} 
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation areas */}
      <div className="absolute left-0 top-0 w-1/3 h-full z-20 cursor-pointer" onClick={goToPrevious} />
      <div className="absolute right-0 top-0 w-1/3 h-full z-20 cursor-pointer" onClick={goToNext} />

      {/* Story content */}
      <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
        {currentStory.content_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
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
          />
        )}

        {/* Render story elements */}
        {storyMetadata.elements?.map(element => (
          <div
            key={element.id}
            className="absolute z-10"
            style={{
              left: element.position.x,
              top: element.position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {element.type === 'sticker' && (
              <span className="text-4xl drop-shadow-lg animate-bounce">
                {element.content}
              </span>
            )}
            {element.type === 'text' && (
              <span 
                style={{
                  color: element.style?.color || '#ffffff',
                  fontSize: (element.style?.fontSize || 16) + 'px',
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
                className="w-20 h-20 object-cover rounded drop-shadow-lg" 
              />
            )}
          </div>
        ))}

        {/* Music indicator */}
        {storyMetadata.elements?.some(e => e.type === 'music') && (
          <div className="absolute top-20 right-4 z-10">
            <div className="bg-black/50 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
              <Music className="w-4 h-4 animate-pulse" />
              <span>♪ Music</span>
            </div>
          </div>
        )}

        {/* Caption/Text overlay */}
        {storyMetadata.textOverlay && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <p className="text-white text-lg font-medium text-center drop-shadow-lg px-4 py-3 bg-black/50 rounded-lg backdrop-blur-sm">
              {storyMetadata.textOverlay}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 z-20">
          <Button 
            variant="ghost" 
            size="lg" 
            className={`text-white hover:bg-white/20 transition-colors p-4 rounded-full ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="lg" className="text-white hover:bg-white/20 p-4 rounded-full">
            <MessageCircle className="w-7 h-7" />
          </Button>
        </div>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 hidden md:flex z-30"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 hidden md:flex z-30"
          onClick={goToNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}
    </div>,
    document.body
  );
};

export default StoryViewer;
