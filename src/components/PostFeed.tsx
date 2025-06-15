
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
      // Fetch posts based on new logic
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

      if (user) {
        console.log('Fetching posts for authenticated user:', user.id);
        
        // Get list of creators the user is subscribed to
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('creator_id, status')
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        if (subError) {
          console.error('Error fetching subscriptions:', subError);
        }

        const subscribedCreatorIds = subscriptions?.map(sub => sub.creator_id) || [];
        console.log('Subscribed to creators:', subscribedCreatorIds);

        // For authenticated users: show posts from subscribed creators + own posts + all free posts
        // We'll fetch all posts and filter appropriately
        const { data: allPosts, error: postsError } = await postsQuery.limit(50);
        
        if (postsError) throw postsError;

        // Get creator profiles to check subscription prices
        const creatorIds = [...new Set(allPosts?.map(post => post.user_id) || [])];
        const { data: creatorProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, subscription_price')
          .in('id', creatorIds);

        if (profilesError) {
          console.error('Error fetching creator profiles:', profilesError);
        }

        const creatorProfilesMap = new Map(
          creatorProfiles?.map(profile => [profile.id, profile]) || []
        );

        // Filter posts based on new logic:
        // 1. Posts from subscribed creators (all posts)
        // 2. User's own posts
        // 3. Free posts from all creators (creators with no subscription price)
        const filteredPosts = allPosts?.filter(post => {
          // Own posts
          if (post.user_id === user.id) return true;
          
          // Posts from subscribed creators
          if (subscribedCreatorIds.includes(post.user_id)) return true;
          
          // Free posts (creators with no subscription price)
          const creatorProfile = creatorProfilesMap.get(post.user_id);
          if (!creatorProfile?.subscription_price) return true;
          
          return false;
        }) || [];

        console.log('Filtered posts:', filteredPosts.length);
        
        // Use filtered posts directly
        const postsData = filteredPosts;
        
        // Process posts normally
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

        // Fetch ALL trailers for authenticated users
        const { data: trailersData, error: trailersError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(20);

        if (trailersError) throw trailersError;

        // Process trailer content
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
      } else {
        // For non-authenticated users, show sample content
        const { data: postsData, error: postsError } = await postsQuery.limit(5);
        if (postsError) throw postsError;

        // Show only free posts for unauthenticated users
        if (postsData && postsData.length > 0) {
          const creatorIds = [...new Set(postsData.map(post => post.user_id))];
          const { data: creatorProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, subscription_price')
            .in('id', creatorIds);

          const creatorProfilesMap = new Map(
            creatorProfiles?.map(profile => [profile.id, profile]) || []
          );

          const freePosts = postsData.filter(post => {
            const creatorProfile = creatorProfilesMap.get(post.user_id);
            return !creatorProfile?.subscription_price;
          });

          // Process free posts
          let processedPosts: FeedItem[] = [];
          if (freePosts && freePosts.length > 0) {
            const userIds = [...new Set(freePosts.map(post => post.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, display_name, username, avatar_url')
              .in('id', userIds);

            if (profilesError) throw profilesError;

            const profilesMap = new Map(
              profilesData?.map(profile => [profile.id, profile]) || []
            );

            const postsWithData = await Promise.all(
              freePosts.map(async (post) => {
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
            setFeedItems(processedPosts);
          }
        }

        // Show sample trailers for unauthenticated users
        const { data: trailersData, error: trailersError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(3);

        if (trailersError) throw trailersError;

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
          setFeedItems(processedTrailers);
        }
      }
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
            <p className="text-gray-600">Create your first post or check back later for content from creators!</p>
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
