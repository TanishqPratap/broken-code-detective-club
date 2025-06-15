
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import TrailerPreviewCard from "./TrailerPreviewCard";

interface Post {
  id: string;
  user_id: string;
  content_type: 'text' | 'image' | 'video';
  text_content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  user_liked?: boolean;
}

interface TrailerContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  order_position: number;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    subscription_price: number | null;
  };
}

type FeedItem = 
  | { type: 'post'; data: Post }
  | { type: 'trailer'; data: TrailerContent };

const PostFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedContent = async () => {
    try {
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          text_content,
          media_url,
          media_type,
          created_at
        `)
        .order('created_at', { ascending: false });

      // If user is logged in, fetch posts from subscribed creators + own posts
      if (user) {
        console.log('Fetching posts for authenticated user:', user.id);
        
        // Get list of creators the user is subscribed to
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('creator_id')
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        if (subError) {
          console.error('Error fetching subscriptions:', subError);
        }

        const subscribedCreatorIds = subscriptions?.map(sub => sub.creator_id) || [];
        console.log('Subscribed to creators:', subscribedCreatorIds);

        // Include user's own posts in the feed
        const relevantUserIds = [...subscribedCreatorIds, user.id];
        
        if (relevantUserIds.length > 0) {
          postsQuery = postsQuery.in('user_id', relevantUserIds);
          console.log('Fetching posts from user IDs:', relevantUserIds);
        } else {
          // If no subscriptions and no own posts, just get user's own posts
          postsQuery = postsQuery.eq('user_id', user.id);
          console.log('No subscriptions found, showing only own posts');
        }
      } else {
        // For non-authenticated users, limit to recent posts (sample feed)
        postsQuery = postsQuery.limit(5);
      }

      const { data: postsData, error: postsError } = await postsQuery.limit(20);

      if (postsError) throw postsError;

      console.log('Fetched posts data:', postsData);

      // Fetch trailer content (same logic as before)
      let trailersQuery = supabase
        .from('trailer_content')
        .select(`
          id,
          title,
          description,
          content_type,
          media_url,
          order_position,
          created_at,
          creator_id
        `)
        .order('created_at', { ascending: false });

      // For authenticated users, also filter trailers by subscriptions
      if (user) {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('creator_id')
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        const subscribedCreatorIds = subscriptions?.map(sub => sub.creator_id) || [];
        
        if (subscribedCreatorIds.length > 0) {
          trailersQuery = trailersQuery.in('creator_id', subscribedCreatorIds);
        } else {
          // If no subscriptions, show limited trailer content
          trailersQuery = trailersQuery.limit(2);
        }
      } else {
        trailersQuery = trailersQuery.limit(3);
      }

      const { data: trailersData, error: trailersError } = await trailersQuery.limit(10);

      if (trailersError) throw trailersError;

      // Process posts
      let processedPosts: FeedItem[] = [];
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(
          profilesData?.map(profile => [profile.id, profile]) || []
        );

        const postsWithData = await Promise.all(
          postsData.map(async (post) => {
            const { count: likesCount } = await supabase
              .from('posts_interactions')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('interaction_type', 'like');

            let userLiked = false;
            if (user) {
              const { data: userLikeData } = await supabase
                .from('posts_interactions')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .eq('interaction_type', 'like')
                .single();
              
              userLiked = !!userLikeData;
            }

            const profile = profilesMap.get(post.user_id);

            return {
              ...post,
              content_type: post.content_type as 'text' | 'image' | 'video',
              profiles: profile || {
                display_name: null,
                username: 'Unknown User',
                avatar_url: null
              },
              likes_count: likesCount || 0,
              user_liked: userLiked
            };
          })
        );

        processedPosts = postsWithData.map(post => ({ type: 'post' as const, data: post }));
      }

      // Process trailer content - fetch creator profiles separately
      let processedTrailers: FeedItem[] = [];
      if (trailersData && trailersData.length > 0) {
        const creatorIds = [...new Set(trailersData.map(trailer => trailer.creator_id))];
        const { data: creatorProfilesData, error: creatorProfilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified, subscription_price')
          .in('id', creatorIds);

        if (creatorProfilesError) throw creatorProfilesError;

        const creatorProfilesMap = new Map(
          creatorProfilesData?.map(profile => [profile.id, profile]) || []
        );

        processedTrailers = trailersData.map(trailer => {
          const creatorProfile = creatorProfilesMap.get(trailer.creator_id);
          
          return {
            type: 'trailer' as const,
            data: {
              ...trailer,
              creator: {
                id: trailer.creator_id,
                username: creatorProfile?.username || 'Unknown',
                display_name: creatorProfile?.display_name || null,
                avatar_url: creatorProfile?.avatar_url || null,
                is_verified: creatorProfile?.is_verified || false,
                subscription_price: creatorProfile?.subscription_price || null,
              }
            }
          };
        });
      }

      // Combine and sort by created_at
      const allItems = [...processedPosts, ...processedTrailers].sort((a, b) => 
        new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
      );

      console.log('Final feed items:', allItems);
      setFeedItems(allItems);
    } catch (error) {
      console.error('Error fetching feed content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedContent();
  }, [user]);

  const handlePostCreated = () => {
    fetchFeedContent();
  };

  const handlePostDeleted = () => {
    fetchFeedContent();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {user && <CreatePost onPostCreated={handlePostCreated} />}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && <CreatePost onPostCreated={handlePostCreated} />}
      
      {feedItems.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">No content yet</h3>
          {user ? (
            <p className="text-gray-600">Subscribe to creators to see their posts here, or create your first post!</p>
          ) : (
            <p className="text-gray-600">Sign in to see personalized content from creators you follow!</p>
          )}
        </div>
      ) : (
        feedItems.map((item, index) => (
          <div key={`${item.type}-${item.data.id}-${index}`}>
            {item.type === 'post' ? (
              <PostCard 
                post={item.data as Post} 
                onDelete={handlePostDeleted}
              />
            ) : (
              <TrailerPreviewCard trailer={item.data as TrailerContent} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PostFeed;
