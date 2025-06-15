
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle } from "lucide-react";
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

const StoryViewer = ({ stories, initialIndex = 0, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();

  const currentStory = stories[currentIndex];
  const duration = currentStory?.content_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image

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

  // Reset like state when story changes
  useEffect(() => {
    setIsLiked(false);
  }, [currentIndex]);

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
      
      // For now, we'll just show a visual feedback
      // In a real app, you'd save this to a story_likes table
      setIsLiked(!isLiked);
      
      if (!isLiked) {
        toast.success("Story liked!");
      } else {
        toast.success("Story unliked!");
      }
      
      console.log(`${isLiked ? 'Unliked' : 'Liked'} story:`, currentStory.id);
    } catch (error) {
      console.error('Error liking story:', error);
      toast.error("Failed to like story");
    } finally {
      setIsLiking(false);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10 max-w-md mx-auto">
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
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10 max-w-md mx-auto">
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
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation areas */}
      <div className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goToPrevious} />
      <div className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goToNext} />

      {/* Story content container - mobile-first design */}
      <div className="relative w-full h-full max-w-sm mx-auto bg-black flex flex-col justify-center items-center px-4">
        <div className="relative w-full aspect-[9/16] max-h-[calc(100vh-120px)] bg-black rounded-lg overflow-hidden">
          {currentStory.content_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
            />
          ) : (
            <video
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
              autoPlay
              muted
              loop
              playsInline
            />
          )}

          {/* Text overlay */}
          {currentStory.text_overlay && (
            <div className="absolute bottom-20 left-4 right-4">
              <p className="text-white text-base font-medium text-center drop-shadow-lg px-4 py-2 bg-black/30 rounded-lg backdrop-blur-sm">
                {currentStory.text_overlay}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-white hover:bg-white/20 transition-colors p-3 rounded-full ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-3 rounded-full">
              <MessageCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation arrows - only show on larger screens */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 hidden md:flex"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 hidden md:flex"
          onClick={goToNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default StoryViewer;
