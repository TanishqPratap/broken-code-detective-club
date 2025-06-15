
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Story {
  id: string;
  creator_id: string;
  thumbnail_url: string | null;
  created_at: string;
  creator: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const MobileStoriesCarousel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          creator_id,
          thumbnail_url,
          created_at,
          profiles:creator_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storiesWithCreator = data?.map(story => ({
        ...story,
        creator: story.profiles as any
      })) || [];

      setStories(storiesWithCreator);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = () => {
    if (!user) {
      // Handle auth required
      return;
    }
    navigate('/vibes?upload=true');
  };

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Your Story / Add Story */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-1">
          <button
            onClick={handleCreateStory}
            className="relative w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Your Story</span>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex-shrink-0 flex flex-col items-center space-y-1 cursor-pointer"
            onClick={() => handleStoryClick(story.id)}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                <Avatar className="w-full h-full border-2 border-white dark:border-gray-900">
                  <AvatarImage src={story.creator.avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                    {story.creator.display_name?.[0] || story.creator.username[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-16 truncate">
              {story.creator.display_name || story.creator.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileStoriesCarousel;
