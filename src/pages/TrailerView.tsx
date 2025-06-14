import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Heart, ArrowLeft, Video, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  subscription_price: number | null;
}

interface Trailer {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  thumbnail_url: string | null;
  order_position: number;
  created_at: string;
  creator: Creator;
}

const TrailerView = () => {
  const { trailerId } = useParams();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [allTrailers, setAllTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trailerId) {
      fetchTrailer();
    }
  }, [trailerId]);

  const fetchTrailer = async () => {
    try {
      setLoading(true);
      
      // Fetch the specific trailer
      const { data: trailerData, error: trailerError } = await supabase
        .from('trailer_content')
        .select('*')
        .eq('id', trailerId)
        .single();

      if (trailerError) throw trailerError;

      if (!trailerData) {
        toast.error("Trailer not found");
        navigate('/');
        return;
      }

      // Fetch creator info
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, subscription_price')
        .eq('id', trailerData.creator_id)
        .single();

      if (creatorError) throw creatorError;

      const trailerWithCreator: Trailer = {
        ...trailerData,
        thumbnail_url: trailerData.thumbnail_url || null,
        creator: creatorData
      };

      console.log('TrailerView - Trailer data for SEO:', {
        id: trailerWithCreator.id,
        title: trailerWithCreator.title,
        thumbnail_url: trailerWithCreator.thumbnail_url,
        media_url: trailerWithCreator.media_url,
        content_type: trailerWithCreator.content_type
      });

      setTrailer(trailerWithCreator);

      // Fetch all trailers from the same creator
      const { data: allTrailersData, error: allTrailersError } = await supabase
        .from('trailer_content')
        .select('*')
        .eq('creator_id', trailerData.creator_id)
        .order('order_position');

      if (!allTrailersError && allTrailersData) {
        const trailersWithCreator = allTrailersData.map(t => ({
          ...t,
          thumbnail_url: t.thumbnail_url || null,
          creator: creatorData
        }));
        setAllTrailers(trailersWithCreator);
      }

    } catch (error) {
      console.error('Error fetching trailer:', error);
      toast.error("Failed to load trailer");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">Loading trailer...</div>
        </div>
      </div>
    );
  }

  if (!trailer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">Trailer not found</div>
        </div>
      </div>
    );
  }

  // Enhanced SEO data for trailers
  const trailerTitle = `${trailer.title} by ${trailer.creator.display_name || trailer.creator.username} | Content Creator Platform`;
  const trailerDescription = trailer.description 
    ? trailer.description.slice(0, 160) + (trailer.description.length > 160 ? '...' : '')
    : `Watch this exclusive ${trailer.content_type} trailer from ${trailer.creator.display_name || trailer.creator.username}. Join now for more amazing content!`;
  const trailerUrl = `${window.location.origin}/trailer/${trailer.id}`;
  
  // Prioritize thumbnail for social sharing
  const socialImage = trailer.thumbnail_url || trailer.media_url;
  
  console.log('TrailerView - SEO Image Selection:', {
    thumbnail_url: trailer.thumbnail_url,
    media_url: trailer.media_url,
    selected: socialImage,
    content_type: trailer.content_type
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <SEOHead
        title={trailerTitle}
        description={trailerDescription}
        image={socialImage}
        url={trailerUrl}
        type="video"
        videoUrl={trailer.content_type === 'video' ? trailer.media_url : undefined}
        thumbnailUrl={trailer.thumbnail_url || undefined}
      />
      
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{trailer.title}</h1>
          <p className="text-gray-500">
            By {trailer.creator.display_name || trailer.creator.username}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                <div className="w-full h-full bg-black rounded-t-lg overflow-hidden">
                  {trailer.content_type === 'video' ? (
                    <video
                      src={trailer.media_url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
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
              <Badge className="absolute top-4 left-4 bg-green-600">
                Free Preview
              </Badge>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{trailer.title}</h3>
              {trailer.description && (
                <p className="text-gray-600 mb-4">{trailer.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {trailer.content_type === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
                <span>Trailer {trailer.order_position}</span>
                <span>•</span>
                <span>{new Date(trailer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">More from {trailer.creator.display_name || trailer.creator.username}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allTrailers.map((t) => (
              <Card key={t.id} className="cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <AspectRatio ratio={16 / 9} className="w-20">
                        <div className="w-full h-full bg-black rounded overflow-hidden">
                          {t.content_type === 'video' ? (
                            <video
                              src={t.media_url}
                              className="w-full h-full object-contain"
                              muted
                            />
                          ) : (
                            <img
                              src={t.media_url}
                              alt={t.title}
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
                      <h5 className="font-medium truncate">{t.title}</h5>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        {t.content_type === 'video' ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Image className="w-3 h-3" />
                        )}
                        <span>Trailer {t.order_position}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default TrailerView;
