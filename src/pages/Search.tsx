import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Users, FileText, Star, DollarSign, AlertCircle, Lock, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_price: number | null;
  is_verified: boolean;
  subscriber_count?: number;
}

interface Post {
  id: string;
  user_id: string;
  content_type: string;
  title: string | null;
  description: string | null;
  text_content: string | null;
  media_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Content {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string | null;
  is_premium: boolean;
  price: number | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('creators');
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const fetchUserSubscriptions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('creator_id')
        .eq('subscriber_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const creatorIds = new Set(data?.map(sub => sub.creator_id) || []);
      setSubscriptions(creatorIds);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  useEffect(() => {
    fetchUserSubscriptions();
  }, [user]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Search creators using safe_profiles to protect user privacy
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('safe_profiles')
        .select('id, username, display_name, bio, avatar_url, is_verified')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (creatorsError) throw creatorsError;

      // Get subscriber counts for creators
      const creatorsWithCounts = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.id)
            .eq('status', 'active');

          return {
            ...creator,
            subscription_price: null, // Hidden for privacy - only visible to creator and subscribers
            subscriber_count: count || 0
          };
        })
      );

      setCreators(creatorsWithCounts);

      // Search posts by title, description, text_content, and content_type
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          title,
          description,
          text_content,
          media_url,
          created_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,text_content.ilike.%${query}%,content_type.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      console.log('Posts search results:', postsData);
      setPosts(postsData || []);

      // Search content by title and description
      const { data: contentsData, error: contentsError } = await supabase
        .from('content')
        .select(`
          id,
          creator_id,
          title,
          description,
          content_type,
          media_url,
          is_premium,
          price,
          created_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (contentsError) throw contentsError;

      console.log('Content search results:', contentsData);
      setContents(contentsData || []);

      // Show success toast if results found
      const totalResults = (creatorsData?.length || 0) + (postsData?.length || 0) + (contentsData?.length || 0);
      if (totalResults > 0) {
        toast({
          title: "Search completed",
          description: `Found ${totalResults} result${totalResults === 1 ? '' : 's'} for "${query}"`,
        });
      } else {
        toast({
          title: "No results found",
          description: `No results found for "${query}". Try different keywords.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    navigate(`/creator/${creatorId}`);
  };

  const handlePostClick = (post: Post) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // For posts, always allow access since posts don't have premium field
    navigate(`/posts/${post.id}`);
  };

  const handleContentClick = (content: Content) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Only check subscription for premium content
    if (content.is_premium && !subscriptions.has(content.creator_id)) {
      // Show subscription prompt for premium content
      toast({
        title: "Subscription Required",
        description: "Subscribe to this creator to view their premium content",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/creator/${content.creator_id}`)}
          >
            Subscribe
          </Button>
        ),
      });
    } else {
      // Allow access to free content or if user is subscribed
      toast({
        title: "Content preview",
        description: "Content detail page coming soon!",
      });
    }
  };

  const isSubscribedToCreator = (creatorId: string) => {
    return user && subscriptions.has(creatorId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Search</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search creators, posts, content titles, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Search results for: <span className="font-semibold">"{searchQuery}"</span>
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Creators ({creators.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Content ({contents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="space-y-4 mt-6">
            {creators.length === 0 && searchQuery && !loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No creators found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {creators.map((creator) => (
                  <Card 
                    key={creator.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCreatorClick(creator.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={creator.avatar_url || ''} />
                          <AvatarFallback>
                            {creator.display_name?.[0] || creator.username?.[0] || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {creator.display_name || creator.username}
                            </h3>
                            {creator.is_verified && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">@{creator.username}</p>
                          {creator.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{creator.bio}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{creator.subscriber_count} subscribers</span>
                            {creator.subscription_price && (
                              <Badge variant="secondary" className="text-xs">
                                ${creator.subscription_price}/mo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-6">
            {posts.length === 0 && searchQuery && !loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No posts found for "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching for different keywords in titles, descriptions, or content.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  // Posts are always visible since they don't have premium field
                  return (
                    <Card 
                      key={post.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handlePostClick(post)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {post.profiles?.display_name || post.profiles?.username || "Unknown User"}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {post.content_type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(post.created_at)}
                              </span>
                            </div>
                            
                            {post.title && (
                              <h4 className="font-semibold text-sm mb-1">{post.title}</h4>
                            )}
                            {post.description && (
                              <p className="text-sm text-gray-600 mb-2">{post.description}</p>
                            )}
                            {post.text_content && !post.title && (
                              <p className="text-sm text-gray-700 mb-2 line-clamp-3">{post.text_content}</p>
                            )}
                            {post.media_url && (
                              <div className="mt-2">
                                {post.content_type === 'image' ? (
                                  <img 
                                    src={post.media_url} 
                                    alt="Post media"
                                    className="max-w-full h-32 object-cover rounded"
                                  />
                                ) : post.content_type === 'video' ? (
                                  <video 
                                    src={post.media_url}
                                    className="max-w-full h-32 object-cover rounded"
                                    controls={false}
                                  />
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-6">
            {contents.length === 0 && searchQuery && !loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No content found for "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching for different keywords in content titles or descriptions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contents.map((content) => {
                  const isSubscribed = isSubscribedToCreator(content.creator_id);
                  const shouldShowContent = !content.is_premium || isSubscribed || !user;

                  return (
                    <Card 
                      key={content.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleContentClick(content)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={content.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {content.profiles?.display_name?.[0] || content.profiles?.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {content.profiles?.display_name || content.profiles?.username || "Unknown Creator"}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {content.content_type}
                              </Badge>
                              {content.is_premium && (
                                <Badge variant="secondary" className="text-xs">
                                  Premium
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(content.created_at)}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold text-sm mb-1">{content.title}</h4>
                            
                            {shouldShowContent ? (
                              <>
                                {content.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{content.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {content.is_premium && content.price && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 text-green-600" />
                                      <span className="text-sm font-medium text-green-600">
                                        ${content.price}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {content.media_url && (
                                  <div className="mt-2">
                                    {content.content_type === 'image' ? (
                                      <img 
                                        src={content.media_url} 
                                        alt="Content media"
                                        className="max-w-full h-32 object-cover rounded"
                                      />
                                    ) : content.content_type === 'video' ? (
                                      <video 
                                        src={content.media_url}
                                        className="max-w-full h-32 object-cover rounded"
                                        controls={false}
                                      />
                                    ) : null}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg mt-2">
                                <div className="text-center">
                                  <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 mb-2">Subscribe to view this premium content</p>
                                  <Button 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/creator/${content.creator_id}`);
                                    }}
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Subscribe
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchQuery && (
          <div className="text-center py-16">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for creators, posts, and content</h3>
            <p className="text-gray-600">Enter a search term to find creators by name, posts by title and description, or premium content by title and description</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default Search;
