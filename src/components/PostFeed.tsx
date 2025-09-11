import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import TrailerPreviewCard from "./TrailerPreviewCard";
import ContentCard from "./ContentCard";

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

interface Content {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  price: number | null;
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
  | { type: 'trailer'; data: TrailerContent }
  | { type: 'content'; data: Content };

const PostFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedContent = async () => {
    try {
      console.log('=== STARTING FEED FETCH ===');
      
      if (user) {
        console.log('Fetching content for authenticated user:', user.id);
        
        // Get subscriptions first
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('creator_id, status')
          .eq('subscriber_id', user.id)
          .eq('status', 'active');

        if (subError) {
          console.error('Error fetching subscriptions:', subError);
        }

        const subscribedCreatorIds = subscriptions?.map(sub => sub.creator_id) || [];
        console.log('Active subscriptions to creators:', subscribedCreatorIds);

        // Fetch ALL posts
        const { data: allPosts, error: postsError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(50);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }

        console.log('Total posts found:', allPosts?.length || 0);

        // Fetch ALL content from content table
        const { data: allContent, error: contentError } = await supabase
          .from('content')
          .select(`
            id,
            creator_id,
            title,
            description,
            content_type,
            media_url,
            thumbnail_url,
            is_premium,
            price,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (contentError) {
          console.error('Error fetching content:', contentError);
          throw contentError;
        }

        console.log('Total content found:', allContent?.length || 0);

        // Get creator profiles to check subscription prices
        const postCreatorIds = [...new Set(allPosts?.map(post => post.user_id) || [])];
        const contentCreatorIds = [...new Set(allContent?.map(content => content.creator_id) || [])];
        const allCreatorIds = [...new Set([...postCreatorIds, ...contentCreatorIds])];
        console.log('Unique creator IDs:', allCreatorIds);

        const { data: creatorProfiles, error: profilesError } = await supabase
          .from('safe_profiles')
          .select('id, subscription_price, username, display_name, avatar_url, is_verified')
          .in('id', allCreatorIds);

        if (profilesError) {
          console.error('Error fetching creator profiles:', profilesError);
        }

        console.log('Creator profiles:', creatorProfiles);

        const creatorProfilesMap = new Map(
          creatorProfiles?.map(profile => [profile.id, profile]) || []
        );

        // Filter posts: subscribed creators + own posts + free posts
        const filteredPosts = allPosts?.filter(post => {
          const isOwnPost = post.user_id === user.id;
          const isSubscribed = subscribedCreatorIds.includes(post.user_id);
          const creatorProfile = creatorProfilesMap.get(post.user_id);
          const isFreePost = !creatorProfile?.subscription_price;
          
          console.log(`Post ${post.id}: own=${isOwnPost}, subscribed=${isSubscribed}, free=${isFreePost}, creator=${creatorProfile?.username}`);
          
          return isOwnPost || isSubscribed || isFreePost;
        }) || [];

        console.log('Posts after filtering:', filteredPosts.length);

        // Filter content: subscribed creators + own content + free content
        const filteredContent = allContent?.filter(content => {
          const isOwnContent = content.creator_id === user.id;
          const isSubscribed = subscribedCreatorIds.includes(content.creator_id);
          const creatorProfile = creatorProfilesMap.get(content.creator_id);
          const isFreeContent = !content.is_premium || content.price === null || content.price === 0;
          
          console.log(`Content ${content.id}: own=${isOwnContent}, subscribed=${isSubscribed}, free=${isFreeContent}, creator=${creatorProfile?.username}`);
          
          return isOwnContent || isSubscribed || isFreeContent;
        }) || [];

        console.log('Content after filtering:', filteredContent.length);

        // Process posts with profile data
        let processedPosts: FeedItem[] = [];
        if (filteredPosts.length > 0) {
          const userIds = [...new Set(filteredPosts.map(post => post.user_id))];
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          const profilesMap = new Map(
            profilesData?.map(profile => [profile.id, profile]) || []
          );

          const postsWithData = await Promise.all(
            filteredPosts.map(async (post) => {
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

        console.log('Processed posts:', processedPosts.length);

        // Process content with creator data
        let processedContent: FeedItem[] = [];
        if (filteredContent.length > 0) {
          processedContent = filteredContent.map(content => {
            const creatorProfile = creatorProfilesMap.get(content.creator_id);
            
            return {
              type: 'content' as const,
              data: {
                ...content,
                creator: {
                  id: content.creator_id,
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

        console.log('Processed content:', processedContent.length);

        // Fetch ALL trailers
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

        if (trailersError) {
          console.error('Error fetching trailers:', trailersError);
          throw trailersError;
        }

        console.log('Total trailers found:', trailersData?.length || 0);

        // Process trailers
        let processedTrailers: FeedItem[] = [];
        if (trailersData && trailersData.length > 0) {
          const trailerCreatorIds = [...new Set(trailersData.map(trailer => trailer.creator_id))];
          const { data: trailerCreatorProfilesData, error: trailerCreatorProfilesError } = await supabase
            .from('safe_profiles')
            .select('id, username, display_name, avatar_url, is_verified, subscription_price')
            .in('id', trailerCreatorIds);

          if (trailerCreatorProfilesError) throw trailerCreatorProfilesError;

          const trailerCreatorProfilesMap = new Map(
            trailerCreatorProfilesData?.map(profile => [profile.id, profile]) || []
          );

          processedTrailers = trailersData.map(trailer => {
            const creatorProfile = trailerCreatorProfilesMap.get(trailer.creator_id);
            
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

        console.log('Processed trailers:', processedTrailers.length);

        // Combine and sort by created_at
        const allItems = [...processedPosts, ...processedContent, ...processedTrailers].sort((a, b) => 
          new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        );

        console.log('=== FINAL FEED SUMMARY ===');
        console.log('Total items in feed:', allItems.length);
        console.log('Posts:', processedPosts.length);
        console.log('Content:', processedContent.length);
        console.log('Trailers:', processedTrailers.length);
        console.log('Feed items:', allItems.map(item => ({
          type: item.type,
          id: item.data.id,
          title: item.type === 'post' ? (item.data as any).text_content?.substring(0, 50) : item.data.title,
          creator: item.type === 'post' ? (item.data as any).profiles?.username : (item.data as any).creator?.username
        })));

        setFeedItems(allItems);
      } else {
        console.log('Fetching content for unauthenticated user');
        
        // For non-authenticated users, show only free posts and sample trailers
        const { data: postsData, error: postsError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(10);

        if (postsError) throw postsError;

        console.log('Posts for unauthenticated user:', postsData?.length || 0);

        // Show only free posts
        if (postsData && postsData.length > 0) {
          const creatorIds = [...new Set(postsData.map(post => post.user_id))];
          const { data: creatorProfiles, error: profilesError } = await supabase
            .from('safe_profiles')
            .select('id, subscription_price, username, display_name, avatar_url')
            .in('id', creatorIds);

          const creatorProfilesMap = new Map(
            creatorProfiles?.map(profile => [profile.id, profile]) || []
          );

          const freePosts = postsData.filter(post => {
            const creatorProfile = creatorProfilesMap.get(post.user_id);
            const isFree = !creatorProfile?.subscription_price;
            console.log(`Post ${post.id} from ${creatorProfile?.username}: free=${isFree}`);
            return isFree;
          });

          console.log('Free posts for unauthenticated user:', freePosts.length);

          const postsWithData = await Promise.all(
            freePosts.map(async (post) => {
              const { count: likesCount } = await supabase
                .from('posts_interactions')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id)
                .eq('interaction_type', 'like');

              const profile = creatorProfilesMap.get(post.user_id);

              return {
                ...post,
                content_type: post.content_type as 'text' | 'image' | 'video',
                profiles: profile || {
                  display_name: null,
                  username: 'Unknown User',
                  avatar_url: null
                },
                likes_count: likesCount || 0,
                user_liked: false
              };
            })
          );

          const processedPosts = postsWithData.map(post => ({ type: 'post' as const, data: post }));
          
          // Also show sample trailers
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
            .limit(5);

          if (trailersError) throw trailersError;

          let processedTrailers: FeedItem[] = [];
          if (trailersData && trailersData.length > 0) {
            const trailerCreatorIds = [...new Set(trailersData.map(trailer => trailer.creator_id))];
            const { data: trailerCreatorProfilesData, error: trailerCreatorProfilesError } = await supabase
              .from('safe_profiles')
              .select('id, username, display_name, avatar_url, is_verified, subscription_price')
              .in('id', trailerCreatorIds);

            if (trailerCreatorProfilesError) throw trailerCreatorProfilesError;

            const trailerCreatorProfilesMap = new Map(
              trailerCreatorProfilesData?.map(profile => [profile.id, profile]) || []
            );

            processedTrailers = trailersData.map(trailer => {
              const creatorProfile = trailerCreatorProfilesMap.get(trailer.creator_id);
              
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

          const allItems = [...processedPosts, ...processedTrailers].sort((a, b) => 
            new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
          );

          console.log('Content for unauthenticated user:', allItems.length);
          setFeedItems(allItems);
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
            ) : item.type === 'trailer' ? (
              <TrailerPreviewCard trailer={item.data as TrailerContent} />
            ) : (
              <ContentCard content={item.data as Content} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PostFeed;
