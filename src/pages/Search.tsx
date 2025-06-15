
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/auth/AuthModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Users, FileText, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  text_content: string | null;
  media_url: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('creators');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Search creators
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, subscription_price, is_verified')
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
            subscriber_count: count || 0
          };
        })
      );

      setCreators(creatorsWithCounts);

      // Search posts with proper join
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content_type,
          text_content,
          media_url,
          created_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .ilike('text_content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      setPosts(postsData || []);
    } catch (error) {
      console.error('Search error:', error);
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
    <Layout onAuthClick={() => setShowAuthModal(true)}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Search</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search creators, posts..."
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

        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Search results for: <span className="font-semibold">"{searchQuery}"</span>
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Creators ({creators.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="space-y-4 mt-6">
            {creators.length === 0 && searchQuery ? (
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
            {posts.length === 0 && searchQuery ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No posts found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="cursor-pointer hover:shadow-lg transition-shadow">
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
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(post.created_at)}
                            </span>
                          </div>
                          {post.text_content && (
                            <p className="text-sm text-gray-700 mb-2">{post.text_content}</p>
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
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchQuery && (
          <div className="text-center py-16">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for creators and posts</h3>
            <p className="text-gray-600">Enter a search term to find creators by username, display name, or posts</p>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </Layout>
  );
};

export default Search;
