
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Eye, FileText, Image, Video } from "lucide-react";

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

interface ContentCardProps {
  content: Content;
}

const ContentCard = ({ content }: ContentCardProps) => {
  const getContentIcon = () => {
    switch (content.content_type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={content.creator.avatar_url || undefined} />
            <AvatarFallback>
              {content.creator.display_name?.[0] || content.creator.username[0] || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {content.creator.display_name || content.creator.username}
              </p>
              {content.creator.is_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">@{content.creator.username}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getContentIcon()}
            {content.is_premium && content.price && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  ${content.price}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{content.title}</h3>
            {content.description && (
              <p className="text-gray-600 mt-1">{content.description}</p>
            )}
          </div>

          {content.media_url && (
            <div className="rounded-lg overflow-hidden">
              {content.content_type === 'image' ? (
                <img
                  src={content.thumbnail_url || content.media_url}
                  alt={content.title}
                  className="w-full h-64 object-cover"
                />
              ) : content.content_type === 'video' ? (
                <div className="relative">
                  <video
                    src={content.media_url}
                    poster={content.thumbnail_url || undefined}
                    controls
                    className="w-full h-64 object-cover"
                  />
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{new Date(content.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCard;
