import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageIcon, VideoIcon, Type, Upload } from "lucide-react";

const CreatePost = ({ onPostCreated }: { onPostCreated: () => void }) => {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
    }
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const generateVideoThumbnail = async (videoUrl: string, fileName: string): Promise<string | null> => {
    try {
      console.log('Generating thumbnail for video:', videoUrl);
      
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          videoUrl: videoUrl,
          bucketName: 'post-media',
          fileName: fileName
        }
      });

      if (error) {
        console.error('Thumbnail generation error:', error);
        return null;
      }

      console.log('Thumbnail generated:', data.thumbnailUrl);
      return data.thumbnailUrl;
    } catch (error) {
      console.error('Error calling thumbnail function:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to create a post");
      return;
    }

    if (contentType === 'text' && !textContent.trim()) {
      toast.error("Please enter some text content");
      return;
    }

    if ((contentType === 'image' || contentType === 'video') && !mediaFile) {
      toast.error(`Please select a ${contentType} file`);
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;
      let thumbnailUrl = null;

      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
        if (!mediaUrl) {
          toast.error("Failed to upload media");
          setIsUploading(false);
          return;
        }
        mediaType = mediaFile.type;

        // Generate thumbnail for video files
        if (contentType === 'video' && mediaFile.type.startsWith('video/')) {
          console.log('Generating thumbnail for uploaded video');
          thumbnailUrl = await generateVideoThumbnail(mediaUrl, `${user.id}/${Date.now()}.${mediaFile.name.split('.').pop()}`);
          if (thumbnailUrl) {
            console.log('Thumbnail URL generated:', thumbnailUrl);
          } else {
            console.warn('Failed to generate thumbnail, will use placeholder');
          }
        }
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content_type: contentType,
          text_content: contentType === 'text' ? textContent : null,
          media_url: mediaUrl,
          media_type: mediaType,
          thumbnail_url: thumbnailUrl
        });

      if (error) throw error;

      toast.success("Post created successfully!");
      setTextContent('');
      setMediaFile(null);
      setContentType('text');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={contentType === 'text' ? 'default' : 'outline'}
              onClick={() => setContentType('text')}
              className="flex items-center gap-2"
            >
              <Type className="w-4 h-4" />
              Text
            </Button>
            <Button
              type="button"
              variant={contentType === 'image' ? 'default' : 'outline'}
              onClick={() => setContentType('image')}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </Button>
            <Button
              type="button"
              variant={contentType === 'video' ? 'default' : 'outline'}
              onClick={() => setContentType('video')}
              className="flex items-center gap-2"
            >
              <VideoIcon className="w-4 h-4" />
              Video
            </Button>
          </div>

          {contentType === 'text' && (
            <div>
              <Label htmlFor="text-content">What's on your mind?</Label>
              <Textarea
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
              />
            </div>
          )}

          {(contentType === 'image' || contentType === 'video') && (
            <div>
              <Label htmlFor="media-file">
                Upload {contentType === 'image' ? 'Image' : 'Video'}
              </Label>
              <Input
                id="media-file"
                type="file"
                accept={contentType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
              />
              {mediaFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {mediaFile.name}
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                {contentType === 'video' ? 'Creating Post & Generating Thumbnail...' : 'Creating Post...'}
              </>
            ) : (
              'Create Post'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
