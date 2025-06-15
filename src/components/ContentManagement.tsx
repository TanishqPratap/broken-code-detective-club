
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, Edit, DollarSign, FileText, Image, Video, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContentUploadModal from "./ContentUploadModal";
import ContentEditModal from "./ContentEditModal";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string | null;
  is_premium: boolean;
  price: number | null;
  created_at: string;
}

const ContentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  useEffect(() => {
    fetchContents();
  }, [user]);

  const fetchContents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (contentId: string, mediaUrl: string | null) => {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (dbError) throw dbError;

      // Delete media file if exists
      if (mediaUrl) {
        const filePath = mediaUrl.split('/').slice(-2).join('/'); // Extract user_id/filename
        await supabase.storage
          .from('post-media')
          .remove([filePath]);
      }

      setContents(contents.filter(c => c.id !== contentId));
      toast.success("Content deleted successfully");
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error("Failed to delete content");
    }
  };

  const handleGoLive = () => {
    navigate("/creator");
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading your content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Upload and manage your premium content
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
              <Button onClick={handleGoLive} variant="outline">
                <Tv className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content yet</h3>
              <p className="text-gray-600 mb-4">
                Start by uploading your first piece of content or going live
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Content
                </Button>
                <Button onClick={handleGoLive} variant="outline">
                  <Tv className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {contents.map((content) => (
                <Card key={content.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getContentIcon(content.content_type)}
                          <div>
                            <h3 className="font-semibold">{content.title}</h3>
                            {content.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {content.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {content.is_premium ? (
                            <>
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                ${content.price || 0}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Free</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingContent(content)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteContent(content.id, content.media_url)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {content.media_url && (
                      <div className="mt-3">
                        {content.content_type === 'image' && (
                          <img
                            src={content.media_url}
                            alt={content.title}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}
                        {content.content_type === 'video' && (
                          <video
                            src={content.media_url}
                            className="w-full h-32 object-cover rounded-md"
                            controls
                          />
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Created: {new Date(content.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ContentUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onContentUploaded={fetchContents}
      />

      {editingContent && (
        <ContentEditModal
          open={!!editingContent}
          onClose={() => setEditingContent(null)}
          content={editingContent}
          onContentUpdated={fetchContents}
        />
      )}
    </div>
  );
};

export default ContentManagement;
