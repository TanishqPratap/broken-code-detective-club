
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Image, Video, Heart, Star } from "lucide-react";

interface TrailerContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  order_position: number;
  created_at: string;
}

interface TrailerViewerProps {
  creatorId: string;
  creatorName: string;
  subscriptionPrice?: number | null;
  onSubscribe?: () => void;
}

const TrailerViewer = ({ creatorId, creatorName, subscriptionPrice, onSubscribe }: TrailerViewerProps) => {
  const [trailers, setTrailers] = useState<TrailerContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerContent | null>(null);

  useEffect(() => {
    fetchTrailers();
  }, [creatorId]);

  const fetchTrailers = async () => {
    try {
      const { data, error } = await supabase
        .from('trailer_content')
        .select('*')
        .eq('creator_id', creatorId)
        .order('order_position');

      if (error) throw error;
      setTrailers(data || []);
      if (data && data.length > 0) {
        setSelectedTrailer(data[0]);
      }
    } catch (error) {
      console.error('Error fetching trailers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading preview content...</div>
        </CardContent>
      </Card>
    );
  }

  if (trailers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Preview Content</h3>
            <p>This creator hasn't uploaded any trailer content yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {creatorName}'s Preview Content
              </CardTitle>
              <CardDescription>
                Watch these free previews to get a taste of {creatorName}'s content
              </CardDescription>
            </div>
            {subscriptionPrice && onSubscribe && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${subscriptionPrice}/month
                </div>
                <Button onClick={onSubscribe} className="mt-2">
                  <Heart className="w-4 h-4 mr-2" />
                  Subscribe Now
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main viewer */}
        <div className="lg:col-span-2">
          {selectedTrailer && (
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <AspectRatio ratio={16/9}>
                    <div className="w-full h-full bg-black rounded-t-lg overflow-hidden">
                      {selectedTrailer.content_type === 'video' ? (
                        <video
                          src={selectedTrailer.media_url}
                          className="w-full h-full object-contain"
                          controls
                          autoPlay
                        />
                      ) : (
                        <img
                          src={selectedTrailer.media_url}
                          alt={selectedTrailer.title}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </AspectRatio>
                  <Badge className="absolute top-4 left-4 bg-green-600">
                    Free Preview
                  </Badge>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{selectedTrailer.title}</h3>
                  {selectedTrailer.description && (
                    <p className="text-gray-600 mb-4">{selectedTrailer.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {selectedTrailer.content_type === 'video' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                    <span>Trailer {selectedTrailer.order_position}</span>
                    <span>•</span>
                    <span>{new Date(selectedTrailer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trailer list */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">All Previews</h4>
          {trailers.map((trailer) => (
            <Card 
              key={trailer.id} 
              className={`cursor-pointer transition-all ${
                selectedTrailer?.id === trailer.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedTrailer(trailer)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <AspectRatio ratio={16/9} className="w-16">
                      <div className="w-full h-full bg-black rounded overflow-hidden">
                        {trailer.content_type === 'video' ? (
                          <video
                            src={trailer.media_url}
                            className="w-full h-full object-contain"
                            muted
                          />
                        ) : (
                          <img
                            src={trailer.media_url}
                            alt={trailer.title}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </AspectRatio>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate">{trailer.title}</h5>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      {trailer.content_type === 'video' ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <Image className="w-3 h-3" />
                      )}
                      <span>Trailer {trailer.order_position}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrailerViewer;
