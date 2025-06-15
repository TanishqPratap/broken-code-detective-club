
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StoryViewer from "./StoryViewer";
import StoryUpload from "./StoryUpload";

interface Story {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  media_url: string;
  content_type: 'image' | 'video';
  text_overlay?: string;
  created_at: string;
  expires_at: string;
}

interface StoryGroup {
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  stories: Story[];
  hasNewStory: boolean;
}

const StoriesCarousel = () => {
  const { user } = useAuth();
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
      // Fetch stories from followed creators and own stories
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

      if (error) throw error;

      // Group stories by creator
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
            hasNewStory: true // For now, assume all stories are new
          };
        }

        groupedStories[creatorId].stories.push({
          id: story.id,
          creator_id: creatorId,
          creator_name: creatorName,
          creator_avatar: creatorAvatar,
          media_url: story.media_url,
          content_type: story.content_type,
          text_overlay: story.text_overlay,
          created_at: story.created_at,
          expires_at: story.expires_at
        });
      });

      setStoryGroups(Object.values(groupedStories));
    } catch (error) {
      console.error('Error fetching stories:', error);
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
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 rounded-full" />
            <div className="w-12 h-3 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-gray-300 dark:border-gray-600">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <StoryUpload />
          </div>
          <span className="text-xs text-center w-16 truncate">Your Story</span>
        </div>

        {/* Story Groups */}
        {storyGroups.map((group) => (
          <div
            key={group.creator_id}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => openStoryViewer(group.stories)}
          >
            <div className="relative">
              <Avatar 
                className={`w-16 h-16 border-2 ${
                  group.hasNewStory 
                    ? 'border-gradient-to-r from-purple-600 to-pink-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <AvatarImage src={group.creator_avatar} />
                <AvatarFallback>{group.creator_name[0]}</AvatarFallback>
              </Avatar>
              {group.hasNewStory && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={group.creator_avatar} />
                    <AvatarFallback>{group.creator_name[0]}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            <span className="text-xs text-center w-16 truncate">
              {group.creator_name}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer */}
      {selectedStoryGroup && (
        <StoryViewer
          stories={selectedStoryGroup}
          initialIndex={selectedIndex}
          onClose={() => setSelectedStoryGroup(null)}
        />
      )}
    </>
  );
};

export default StoriesCarousel;
