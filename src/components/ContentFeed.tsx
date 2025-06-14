
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreHorizontal, Lock } from "lucide-react";

interface Post {
  id: string;
  creator: {
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  content: {
    type: "image" | "video" | "text";
    url?: string;
    text?: string;
  };
  isLocked: boolean;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

interface ContentFeedProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

const ContentFeed = ({ posts, onLike, onComment, onShare }: ContentFeedProps) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.creator.avatar} />
                  <AvatarFallback>{post.creator.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{post.creator.displayName}</h4>
                    {post.creator.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{post.creator.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Content */}
            {post.content.text && (
              <p className="mb-4">{post.content.text}</p>
            )}
            
            {post.content.type !== "text" && (
              <div className="relative mb-4">
                <div className="h-64 bg-muted rounded-lg overflow-hidden">
                  {post.isLocked ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/20">
                      <div className="text-center">
                        <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Subscribe to unlock this content
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40"></div>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={post.isLiked ? "text-red-500" : ""}
                  onClick={() => onLike(post.id)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                  {post.likes}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => onComment(post.id)}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => onShare(post.id)}>
                  <Share className="w-4 h-4" />
                </Button>
              </div>
              
              <span className="text-sm text-muted-foreground">{post.timestamp}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContentFeed;
