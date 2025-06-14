
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, Image, Video, Eye } from "lucide-react";

interface TrailerContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string;
  order_position: number;
  created_at: string;
}

const TrailerUpload = () => {
  const { user } = useAuth();
  const [trailers, setTrailers] = useState<TrailerContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchTrailers();
    }
  }, [user]);

  const fetchTrailers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trailer_content')
        .select('*')
        .eq('creator_id', user.id)
        .order('order_position');

      if (error) throw error;
      setTrailers(data || []);
    } catch (error) {
      console.error('Error fetching trailers:', error);
      toast.error("Failed to load trailer content");
    } finally {
      setLoading(false);
    }
  };

  const uploadTrailer = async (position: number, file: File, title: string, description: string) => {
    if (!user) return;

    setUploading(position);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/trailer_${position}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trailer-content')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('trailer-content')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('trailer_content')
        .upsert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          content_type: file.type.startsWith('video/') ? 'video' : 'image',
          media_url: data.publicUrl,
          order_position: position
        });

      if (dbError) throw dbError;

      toast.success(`Trailer ${position} uploaded successfully!`);
      fetchTrailers();
    } catch (error) {
      console.error('Error uploading trailer:', error);
      toast.error("Failed to upload trailer");
    } finally {
      setUploading(null);
    }
  };

  const deleteTrailer = async (id: string, mediaUrl: string, position: number) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('trailer_content')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Delete file from storage
      const filePath = mediaUrl.split('/').slice(-2).join('/');
      await supabase.storage
        .from('trailer-content')
        .remove([filePath]);

      toast.success(`Trailer ${position} deleted successfully`);
      fetchTrailers();
    } catch (error) {
      console.error('Error deleting trailer:', error);
      toast.error("Failed to delete trailer");
    }
  };

  const TrailerSlot = ({ position }: { position: number }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
    const existingTrailer = trailers.find(t => t.order_position === position);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
        if (validTypes.includes(selectedFile.type)) {
          setFile(selectedFile);
        } else {
          toast.error("Please select a valid image or video file");
        }
      }
    };

    const handleUpload = () => {
      if (!file || !title.trim()) {
        toast.error("Please provide a title and select a file");
        return;
      }
      uploadTrailer(position, file, title, description);
      setTitle('');
      setDescription('');
      setFile(null);
    };

    if (existingTrailer) {
      return (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Trailer {position}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteTrailer(existingTrailer.id, existingTrailer.media_url, position)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold">{existingTrailer.title}</h3>
              {existingTrailer.description && (
                <p className="text-sm text-gray-600">{existingTrailer.description}</p>
              )}
            </div>
            
            <div className="relative">
              {existingTrailer.content_type === 'video' ? (
                <video
                  src={existingTrailer.media_url}
                  className="w-full h-32 object-cover rounded-md"
                  controls
                />
              ) : (
                <img
                  src={existingTrailer.media_url}
                  alt={existingTrailer.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                {existingTrailer.content_type === 'video' ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <Image className="w-3 h-3" />
                )}
                Free Preview
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Uploaded: {new Date(existingTrailer.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Trailer {position}</CardTitle>
          <CardDescription>Upload a free preview for subscribers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`title-${position}`}>Title</Label>
            <Input
              id={`title-${position}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter trailer title"
            />
          </div>
          
          <div>
            <Label htmlFor={`description-${position}`}>Description (optional)</Label>
            <Textarea
              id={`description-${position}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this trailer..."
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor={`file-${position}`}>Upload Image or Video</Label>
            <Input
              id={`file-${position}`}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!file || !title.trim() || uploading === position}
            className="w-full"
          >
            {uploading === position ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Trailer
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading trailer content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Trailer Content Management
          </CardTitle>
          <CardDescription>
            Upload up to 4 free trailer pieces that subscribers can watch before deciding to subscribe.
            These previews help potential subscribers understand your content quality.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((position) => (
          <TrailerSlot key={position} position={position} />
        ))}
      </div>
    </div>
  );
};

export default TrailerUpload;
