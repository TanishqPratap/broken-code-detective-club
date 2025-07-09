
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StoryViewer from "./StoryViewer";
import StoryUpload from "./StoryUpload";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Story = Tables<"stories"> & {
  creator_name: string;
  creator_avatar: string;
};

interface StoryGroup {
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  stories: Story[];
  hasNewStory: boolean;
}

const StoriesCarousel = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<Story[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, [user]);

  const fetchStories = async () => {
    if (!user) return;

    try {
      console.log('Fetching stories...');
      
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        throw error;
      }

      console.log('Fetched stories:', stories);

      const groupedStories: { [key: string]: StoryGroup } = {};

      stories?.forEach((story: any) => {
        const creatorId = story.creator_id;
        const creatorName = story.profiles?.display_name || story.profiles?.username || 'Unknown';
        const creatorAvatar = story.profiles?.avatar_url || '';

        if (!groupedStories[creatorId]) {
          groupedStories[creatorId] = {
            creator_id: creatorId,
            creator_name: creatorName,
            creator_avatar: creatorAvatar,
            stories: [],
            hasNewStory: true
          };
        }

        groupedStories[creatorId].stories.push({
          ...story,
          creator_name: creatorName,
          creator_avatar: creatorAvatar
        });
      });

      setStoryGroups(Object.values(groupedStories));
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = (stories: Story[], startIndex: number = 0) => {
    setSelectedStoryGroup(stories);
    setSelectedIndex(startIndex);
  };

  if (loading) {
    return (
      <div className={`flex gap-3 p-3 overflow-x-auto scrollbar-hide ${isMobile ? 'pb-safe' : 'gap-4 p-4'}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
            <div className={`${isMobile ? 'w-16 h-16' : 'w-16 h-16'} bg-gray-300 rounded-full`} />
            <div className={`${isMobile ? 'w-12 h-2' : 'w-12 h-3'} bg-gray-300 rounded`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div 
        className={`flex gap-3 p-3 overflow-x-auto scrollbar-hide ${isMobile ? 'pb-safe touch-pan-x' : 'gap-4 p-4'}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-fit">
          <div className="relative">
            <Avatar className={`${isMobile ? 'w-16 h-16' : 'w-16 h-16'} border-2 border-gray-300 dark:border-gray-600`}>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">You</AvatarFallback>
            </Avatar>
            <StoryUpload onStoryUploaded={fetchStories} />
          </div>
          <span className={`${isMobile ? 'text-xs w-16' : 'text-xs w-16'} text-center truncate`}>
            Your Story
          </span>
        </div>

        {/* Story Groups */}
        {storyGroups.map((group) => (
          <div
            key={group.creator_id}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer touch-manipulation min-w-fit"
            onClick={() => openStoryViewer(group.stories)}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{ 
              transition: 'transform 0.1s ease',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div className="relative">
              <Avatar 
                className={`${isMobile ? 'w-16 h-16' : 'w-16 h-16'} border-2 ${
                  group.hasNewStory 
                    ? 'border-gradient-to-r from-purple-600 to-pink-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <AvatarImage src={group.creator_avatar} />
                <AvatarFallback className="text-xs">{group.creator_name[0]}</AvatarFallback>
              </Avatar>
              {group.hasNewStory && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={group.creator_avatar} />
                    <AvatarFallback className="text-xs">{group.creator_name[0]}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            <span className={`${isMobile ? 'text-xs w-16' : 'text-xs w-16'} text-center truncate`}>
              {group.creator_name}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer - Full Screen */}
      {selectedStoryGroup && (
        <StoryViewer
          stories={selectedStoryGroup}
          initialIndex={selectedIndex}
          onClose={() => setSelectedStoryGroup(null)}
        />
      )}

      <style>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
};

export default StoriesCarousel;
