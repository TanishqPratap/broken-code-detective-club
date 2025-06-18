
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3, Users, DollarSign, Video, Film, UserCheck, Eye } from "lucide-react";
import ContentManagement from "./ContentManagement";
import ContentScheduler from "./ContentScheduler";
import VibesUpload from "./VibesUpload";
import TrailerUpload from "./TrailerUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatorDashboardProps {
  onNavigateToLivestream?: () => void;
  onNavigateToContent?: () => void;
}

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  totalSubscribers: number;
  totalEarnings: number;
}

const CreatorDashboard = ({ onNavigateToLivestream, onNavigateToContent }: CreatorDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showVibesUpload, setShowVibesUpload] = useState(false);
  const [showContentUpload, setShowContentUpload] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalSubscribers: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      }

      // Fetch subscribers count
      const { count: subscribersCount, error: subscribersError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'active');

      if (subscribersError) {
        console.error('Error fetching subscribers:', subscribersError);
      }

      // Fetch total likes from posts interactions
      const { count: postLikesCount, error: postLikesError } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('interaction_type', 'like')
        .in('post_id', 
          await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .then(({ data }) => data?.map(post => post.id) || [])
        );

      if (postLikesError) {
        console.error('Error fetching post likes:', postLikesError);
      }

      // Fetch content likes
      const { count: contentLikesCount, error: contentLikesError } = await supabase
        .from('content_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('interaction_type', 'like')
        .in('content_id',
          await supabase
            .from('content')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(content => content.id) || [])
        );

      if (contentLikesError) {
        console.error('Error fetching content likes:', contentLikesError);
      }

      // Fetch story likes
      const { count: storyLikesCount, error: storyLikesError } = await supabase
        .from('story_likes')
        .select('*', { count: 'exact', head: true })
        .in('story_id',
          await supabase
            .from('stories')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(story => story.id) || [])
        );

      if (storyLikesError) {
        console.error('Error fetching story likes:', storyLikesError);
      }

      // Fetch earnings from tips
      const { data: tipsData, error: tipsError } = await supabase
        .from('tips')
        .select('amount')
        .eq('creator_id', user.id);

      if (tipsError) {
        console.error('Error fetching tips:', tipsError);
      }

      // Fetch earnings from stream tips
      const { data: streamTipsData, error: streamTipsError } = await supabase
        .from('stream_tips')
        .select('amount')
        .in('stream_id',
          await supabase
            .from('live_streams')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(stream => stream.id) || [])
        );

      if (streamTipsError) {
        console.error('Error fetching stream tips:', streamTipsError);
      }

      // Calculate total earnings
      const tipEarnings = tipsData?.reduce((sum, tip) => sum + Number(tip.amount), 0) || 0;
      const streamTipEarnings = streamTipsData?.reduce((sum, tip) => sum + Number(tip.amount), 0) || 0;
      const totalEarnings = tipEarnings + streamTipEarnings;

      // Calculate total likes
      const totalLikes = (postLikesCount || 0) + (contentLikesCount || 0) + (storyLikesCount || 0);

      // For views, we'll use a combination of stream viewers and content interactions as a proxy
      const { count: streamViewersCount, error: streamViewersError } = await supabase
        .from('stream_viewers')
        .select('*', { count: 'exact', head: true })
        .in('stream_id',
          await supabase
            .from('live_streams')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(stream => stream.id) || [])
        );

      if (streamViewersError) {
        console.error('Error fetching stream viewers:', streamViewersError);
      }

      // Calculate approximate views (stream viewers + post interactions + content interactions)
      const { count: postInteractionsCount, error: postInteractionsError } = await supabase
        .from('posts_interactions')
        .select('*', { count: 'exact', head: true })
        .in('post_id',
          await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .then(({ data }) => data?.map(post => post.id) || [])
        );

      if (postInteractionsError) {
        console.error('Error fetching post interactions:', postInteractionsError);
      }

      const { count: contentInteractionsCount, error: contentInteractionsError } = await supabase
        .from('content_interactions')
        .select('*', { count: 'exact', head: true })
        .in('content_id',
          await supabase
            .from('content')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(content => content.id) || [])
        );

      if (contentInteractionsError) {
        console.error('Error fetching content interactions:', contentInteractionsError);
      }

      const approximateViews = (streamViewersCount || 0) + (postInteractionsCount || 0) + (contentInteractionsCount || 0);

      setAnalyticsData({
        totalViews: approximateViews,
        totalLikes: totalLikes,
        totalFollowers: followersCount || 0,
        totalSubscribers: subscribersCount || 0,
        totalEarnings: totalEarnings
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = () => {
    if (onNavigateToLivestream) {
      onNavigateToLivestream();
    } else {
      setActiveTab("livestream");
    }
  };

  const handleNewContent = () => {
    if (onNavigateToContent) {
      onNavigateToContent();
    } else {
      setActiveTab("content");
      setShowContentUpload(true);
    }
  };

  if (showVibesUpload) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Vibe</h1>
          <Button 
            variant="outline" 
            onClick={() => setShowVibesUpload(false)}
          >
            Back to Dashboard
          </Button>
        </div>
        <VibesUpload 
          onUploadComplete={() => setShowVibesUpload(false)}
          onClose={() => setShowVibesUpload(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Creator Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowVibesUpload(true)}>
            <Film className="w-4 h-4 mr-2" />
            Create Vibe
          </Button>
          <Button variant="outline" onClick={handleNewContent}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Content
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="trailers">Trailers</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : analyticsData.totalViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : "Based on interactions & stream views"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : analyticsData.totalLikes.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : "Across all your content"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : analyticsData.totalFollowers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : "People following you"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : analyticsData.totalSubscribers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : "Active paid subscribers"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${loading ? "..." : analyticsData.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading..." : "From tips & stream donations"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setShowVibesUpload(true)}
                >
                  <Film className="w-6 h-6" />
                  Create Vibe
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2" 
                  onClick={() => setActiveTab("trailers")}
                >
                  <Eye className="w-6 h-6" />
                  Manage Trailers
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleGoLive}>
                  <Video className="w-6 h-6" />
                  Go Live
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleNewContent}>
                  <PlusCircle className="w-6 h-6" />
                  Upload Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <ContentManagement 
            onUploadClick={() => setShowContentUpload(true)}
            onGoLiveClick={handleGoLive}
          />
        </TabsContent>

        <TabsContent value="trailers">
          <TrailerUpload />
        </TabsContent>

        <TabsContent value="scheduler">
          <ContentScheduler />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorDashboard;
