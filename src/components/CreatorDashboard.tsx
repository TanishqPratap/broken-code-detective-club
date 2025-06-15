
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3, Users, DollarSign, Video, Film } from "lucide-react";
import ContentManagement from "./ContentManagement";
import ContentScheduler from "./ContentScheduler";
import VibesUpload from "./VibesUpload";
import { useAuth } from "@/hooks/useAuth";

interface CreatorDashboardProps {
  onNavigateToLivestream?: () => void;
  onNavigateToContent?: () => void;
}

const CreatorDashboard = ({ onNavigateToLivestream, onNavigateToContent }: CreatorDashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showVibesUpload, setShowVibesUpload] = useState(false);
  const [showContentUpload, setShowContentUpload] = useState(false);

  // Mock analytics data
  const analyticsData = {
    totalViews: 12500,
    totalLikes: 890,
    totalFollowers: 456,
    totalEarnings: 1250.75
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+15.3% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalFollowers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+8.7% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">+12.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setShowVibesUpload(true)}
                >
                  <Film className="w-6 h-6" />
                  Create Vibe
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
