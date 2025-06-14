
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Lock, Play, UserPlus, MessageSquare } from "lucide-react";

interface CreatorProfileProps {
  creator: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    avatar: string;
    coverImage: string;
    subscriberCount: number;
    postCount: number;
    isSubscribed: boolean;
    subscriptionPrice: number;
  };
  onSubscribe?: () => void;
  onStartPaidDM?: () => void;
}

const CreatorProfile = ({ creator, onSubscribe, onStartPaidDM }: CreatorProfileProps) => {
  const posts = [
    {
      id: 1,
      type: "image",
      thumbnail: "",
      isLocked: !creator.isSubscribed,
      likes: 45,
      comments: 12,
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      type: "video",
      thumbnail: "",
      isLocked: !creator.isSubscribed,
      likes: 89,
      comments: 23,
      timestamp: "1 day ago"
    },
    {
      id: 3,
      type: "image",
      thumbnail: "",
      isLocked: false,
      likes: 67,
      comments: 8,
      timestamp: "2 days ago"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <div className="h-64 bg-gradient-to-r from-primary/30 to-primary/50 relative">
        {creator.coverImage && (
          <img 
            src={creator.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback className="text-2xl">{creator.displayName[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{creator.displayName}</h1>
              <p className="text-muted-foreground mb-2">@{creator.username}</p>
              <p className="mb-4">{creator.bio}</p>
              
              <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                <span><strong>{creator.postCount}</strong> posts</span>
                <span><strong>{creator.subscriberCount}</strong> subscribers</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              {creator.isSubscribed ? (
                <Button>
                  <Heart className="w-4 h-4 mr-2" />
                  Subscribed
                </Button>
              ) : (
                <Button onClick={onSubscribe}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Subscribe for ${creator.subscriptionPrice}/month
                </Button>
              )}
              <Button variant="outline" onClick={onStartPaidDM}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Paid DM
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-64 bg-muted">
                {post.isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                )}
                {post.type === "video" && !post.isLocked && (
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40"></div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                  <span>{post.timestamp}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
