
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Star, UserPlus, Eye } from "lucide-react";

interface TrailerPreviewCardProps {
  trailer: {
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
  };
}

const TrailerPreviewCard = ({ trailer }: TrailerPreviewCardProps) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCreatorClick = () => {
    navigate(`/creator/${trailer.creator.id}`);
  };

  const handlePreviewClick = () => {
    if (trailer.content_type === 'video') {
      setIsPlaying(!isPlaying);
    } else {
      navigate(`/creator/${trailer.creator.id}`);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
            onClick={handleCreatorClick}
          >
            <Avatar>
              <AvatarImage src={trailer.creator.avatar_url || ''} />
              <AvatarFallback>
                {trailer.creator.display_name?.[0] || trailer.creator.username?.[0] || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  {trailer.creator.display_name || trailer.creator.username}
                </h4>
                {trailer.creator.is_verified && (
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{trailer.creator.username}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Free Preview
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4">
          <h3 className="font-medium mb-2">{trailer.title}</h3>
          {trailer.description && (
            <p className="text-sm text-muted-foreground mb-3">{trailer.description}</p>
          )}
        </div>

        {/* Media Content */}
        <div 
          className="relative h-64 bg-muted rounded-lg overflow-hidden cursor-pointer group"
          onClick={handlePreviewClick}
        >
          {trailer.content_type === 'video' ? (
            <>
              {isPlaying ? (
                <video
                  src={trailer.media_url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              ) : (
                <>
                  <video
                    src={trailer.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                    <div className="bg-white bg-opacity-90 rounded-full p-3">
                      <Play className="w-6 h-6 text-black fill-current" />
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <img
                src={trailer.media_url}
                alt={trailer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-3">
                  <Eye className="w-6 h-6 text-black" />
                </div>
              </div>
            </>
          )}
          
          <Badge className="absolute top-3 left-3 bg-purple-600">
            Trailer {trailer.order_position}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {new Date(trailer.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center gap-2">
            {trailer.creator.subscription_price && (
              <span className="text-sm font-medium text-green-600">
                ${trailer.creator.subscription_price}/month
              </span>
            )}
            <Button size="sm" onClick={handleCreatorClick}>
              <UserPlus className="w-4 h-4 mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrailerPreviewCard;
