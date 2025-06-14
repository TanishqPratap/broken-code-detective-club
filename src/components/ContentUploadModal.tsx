
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, FileText, Image, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContentUploadModalProps {
  open: boolean;
  onClose: () => void;
  onContentUploaded: () => void;
}

const ContentUploadModal = ({ open, onClose, onContentUploaded }: ContentUploadModalProps) => {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to upload content");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if ((contentType === 'image' || contentType === 'video') && !mediaFile) {
      toast.error(`Please select a ${contentType} file`);
      return;
    }

    if (isPremium && (!price || parseFloat(price) <= 0)) {
      toast.error("Please enter a valid price for premium content");
      return;
    }

    setUploading(true);

    try {
      let mediaUrl = null;

      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
        if (!mediaUrl) {
          toast.error("Failed to upload media");
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('content')
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          content_type: contentType,
          media_url: mediaUrl,
          is_premium: isPremium,
          price: isPremium ? parseFloat(price) : null
        });

      if (error) throw error;

      toast.success("Content uploaded successfully!");
      onContentUploaded();
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setIsPremium(false);
      setPrice('');
      setMediaFile(null);
      setContentType('text');
    } catch (error) {
      console.error('Error uploading content:', error);
      toast.error("Failed to upload content");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Content</DialogTitle>
          <DialogDescription>
            Create and upload premium content for your subscribers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={contentType === 'text' ? 'default' : 'outline'}
              onClick={() => setContentType('text')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Text
            </Button>
            <Button
              type="button"
              variant={contentType === 'image' ? 'default' : 'outline'}
              onClick={() => setContentType('image')}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Image
            </Button>
            <Button
              type="button"
              variant={contentType === 'video' ? 'default' : 'outline'}
              onClick={() => setContentType('video')}
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Video
            </Button>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content..."
              rows={3}
            />
          </div>

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
                required
              />
              {mediaFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {mediaFile.name}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="premium"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
            <Label htmlFor="premium">Premium Content</Label>
          </div>

          {isPremium && (
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Content'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentUploadModal;
