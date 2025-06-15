
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
    <div className="w-full bg-white">
      {/* Cover Photo */}
      <div className="h-40 sm:h-48 md:h-64 bg-gradient-to-r from-primary/30 to-primary/50 relative">
        {creator.coverImage && (
          <img 
            src={creator.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        {/* Profile Header */}
        <div className="relative -mt-12 sm:-mt-16 mb-6 sm:mb-8 bg-white rounded-t-lg">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-end sm:gap-6 bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white mx-auto sm:mx-0">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback className="text-xl sm:text-2xl">{creator.displayName[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">{creator.displayName}</h1>
              <p className="text-muted-foreground mb-2 text-sm sm:text-base">@{creator.username}</p>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base px-4 sm:px-0">{creator.bio}</p>
              
              <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-muted-foreground mb-4">
                <span><strong>{creator.postCount}</strong> posts</span>
                <span><strong>{creator.subscriberCount}</strong> subscribers</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 px-4 sm:px-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Share
              </Button>
              {creator.isSubscribed ? (
                <Button className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Subscribed
                </Button>
              ) : (
                <Button onClick={onSubscribe} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Subscribe for ${creator.subscriptionPrice}/month</span>
                  <span className="sm:hidden">${creator.subscriptionPrice}/mo</span>
                </Button>
              )}
              {onStartPaidDM && (
                <Button variant="outline" onClick={onStartPaidDM} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Paid DM
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pb-6 sm:pb-8 bg-white">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-48 sm:h-64 bg-muted">
                {post.isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                )}
                {post.type === "video" && !post.isLocked && (
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40"></div>
              </div>
              
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                  <span className="text-xs">{post.timestamp}</span>
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
