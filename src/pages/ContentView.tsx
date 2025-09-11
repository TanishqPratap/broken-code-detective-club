
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ContentCard from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
    subscription_price?: number | null; // Optional for backward compatibility
  };
}

const ContentView = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contentId) {
      fetchContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("content")
        .select(`
          *,
          creator:profiles!content_creator_id_fkey(
            id, username, display_name, avatar_url, is_verified
          )
        `)
        .eq("id", contentId)
        .single();

      if (error || !data) {
        toast.error("Content not found");
        navigate("/");
        return;
      }

      setContent(data as Content);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => {}} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Loading content...</div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => {}} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Content not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => {}} />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Content</h1>
        </div>
        <ContentCard content={content} />
      </div>
    </div>
  );
};

export default ContentView;
