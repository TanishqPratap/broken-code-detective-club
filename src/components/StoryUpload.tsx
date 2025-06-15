
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, Image, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StoryUpload = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textOverlay, setTextOverlay] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        toast.error("Please select an image or video file");
        return;
      }

      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadStory = async () => {
    if (!user || !file) return;

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(filePath);

      // Save story to database
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          creator_id: user.id,
          media_url: publicUrl,
          content_type: file.type.startsWith('image/') ? 'image' : 'video',
          text_overlay: textOverlay || null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        });

      if (dbError) throw dbError;

      toast.success("Story uploaded successfully!");
      setIsOpen(false);
      setFile(null);
      setTextOverlay("");
      setPreview(null);
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error("Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Story
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload an image or video for your story
              </p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-upload"
              />
              <Label htmlFor="story-upload" className="cursor-pointer">
                <Button type="button" variant="outline">
                  Choose File
                </Button>
              </Label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={preview || ''} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={preview || ''} className="w-full h-full object-cover" controls />
                )}
                
                {textOverlay && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-center font-medium drop-shadow-lg">
                      {textOverlay}
                    </p>
                  </div>
                )}
              </div>

              {/* Text overlay input */}
              <div>
                <Label htmlFor="text-overlay">Text Overlay (Optional)</Label>
                <Textarea
                  id="text-overlay"
                  placeholder="Add text to your story..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  maxLength={150}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {textOverlay.length}/150 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setTextOverlay("");
                  }}
                  className="flex-1"
                >
                  Change File
                </Button>
                <Button
                  onClick={uploadStory}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? "Uploading..." : "Share Story"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryUpload;
