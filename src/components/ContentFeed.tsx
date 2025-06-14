
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share, MoreHorizontal, Lock, Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

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
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleCommentSubmit = (postId: string) => {
    const comment = commentTexts[postId]?.trim();
    if (!comment) return;

    // Create new comment
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: "current-user",
      username: "you",
      displayName: "You",
      avatar: "",
      text: comment,
      timestamp: "now"
    };

    // Add comment to post comments
    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    // Call the parent's onComment function
    onComment(postId);
    
    // Clear the comment input
    setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    
    toast.success("Comment posted!");
  };

  const handleShare = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const shareData = {
      title: `Check out this post by ${post.creator.displayName}`,
      text: post.content.text || `Amazing content from ${post.creator.displayName}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Post shared successfully!");
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
      onShare(postId);
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to share post");
    }
  };

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
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleComments(post.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments + (postComments[post.id]?.length || 0)}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleShare(post.id)}
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
              
              <span className="text-sm text-muted-foreground">{post.timestamp}</span>
            </div>

            {/* Comments Section */}
            {expandedComments.includes(post.id) && (
              <div className="mt-4 space-y-4 border-t pt-4">
                {/* Add Comment Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => setCommentTexts(prev => ({ 
                      ...prev, 
                      [post.id]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCommentSubmit(post.id);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={!commentTexts[post.id]?.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Display Comments */}
                <div className="space-y-3">
                  {postComments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.displayName}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContentFeed;
