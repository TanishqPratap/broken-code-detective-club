
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, Palette, Music, Smile } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StoryEnhancementPanel from "./StoryEnhancementPanel";

interface StoryUploadProps {
  onStoryUploaded?: () => void;
}

interface StoryElement {
  id: string;
  type: 'sticker' | 'text' | 'gif' | 'music';
  content: string;
  position: { x: number; y: number };
  style?: any;
}

const StoryUpload = ({ onStoryUploaded }: StoryUploadProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textOverlay, setTextOverlay] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
      
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

  const handleStickerSelect = (sticker: string) => {
    const newElement: StoryElement = {
      id: Date.now().toString(),
      type: 'sticker',
      content: sticker,
      position: { x: Math.random() * 200, y: Math.random() * 200 }
    };
    setStoryElements(prev => [...prev, newElement]);
    toast.success("Sticker added!");
  };

  const handleTextAdd = (text: string, style: any) => {
    const newElement: StoryElement = {
      id: Date.now().toString(),
      type: 'text',
      content: text,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      style
    };
    setStoryElements(prev => [...prev, newElement]);
  };

  const handleGifSelect = (gif: string) => {
    const newElement: StoryElement = {
      id: Date.now().toString(),
      type: 'gif',
      content: gif,
      position: { x: Math.random() * 200, y: Math.random() * 200 }
    };
    setStoryElements(prev => [...prev, newElement]);
    toast.success("GIF added!");
  };

  const handleMusicSelect = (music: string) => {
    const newElement: StoryElement = {
      id: Date.now().toString(),
      type: 'music',
      content: music,
      position: { x: 0, y: 0 }
    };
    setStoryElements(prev => [...prev.filter(e => e.type !== 'music'), newElement]);
    toast.success("Music added!");
  };

  const handleDrawingToggle = () => {
    setIsDrawingMode(!isDrawingMode);
    toast.info(isDrawingMode ? "Drawing mode disabled" : "Drawing mode enabled");
  };

  const uploadStory = async () => {
    if (!user || !file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);
      console.log('Starting story upload for user:', user.id);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      // Prepare story metadata with enhancements
      const storyMetadata = {
        elements: storyElements,
        textOverlay: textOverlay || null,
        hasDrawing: isDrawingMode
      };

      // Save story to database
      const { data: storyData, error: dbError } = await supabase
        .from('stories')
        .insert({
          creator_id: user.id,
          media_url: publicUrl,
          content_type: file.type.startsWith('image/') ? 'image' : 'video',
          text_overlay: JSON.stringify(storyMetadata),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error(`Database error: ${dbError.message}`);
        return;
      }

      console.log('Story saved to database:', storyData);
      toast.success("Story uploaded successfully!");
      
      // Reset form
      resetForm();
      setIsOpen(false);
      
      // Call the callback to refresh stories
      if (onStoryUploaded) {
        onStoryUploaded();
      }
    } catch (error) {
      console.error('Unexpected error uploading story:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTextOverlay("");
    setStoryElements([]);
    setIsDrawingMode(false);
    setShowEnhancements(false);
  };

  const removeElement = (elementId: string) => {
    setStoryElements(prev => prev.filter(e => e.id !== elementId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 bg-blue-600 border-2 border-white text-white hover:bg-blue-700"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-[70vh]">
          {/* Main content area */}
          <div className="flex-1 space-y-4">
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload an image or video for your story
                </p>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="story-upload"
                />
                <Label htmlFor="story-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            ) : (
              <div className="space-y-4 h-full">
                {/* Preview area */}
                <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img src={preview || ''} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={preview || ''} className="w-full h-full object-cover" controls />
                  )}
                  
                  {/* Render story elements overlay */}
                  {storyElements.map(element => (
                    <div
                      key={element.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: element.position.x,
                        top: element.position.y,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => removeElement(element.id)}
                    >
                      {element.type === 'sticker' && (
                        <span className="text-3xl">{element.content}</span>
                      )}
                      {element.type === 'text' && (
                        <span 
                          style={{
                            color: element.style?.color,
                            fontSize: element.style?.fontSize,
                            fontWeight: element.style?.fontWeight,
                            backgroundColor: element.style?.backgroundColor
                          }}
                          className="px-2 py-1 rounded"
                        >
                          {element.content}
                        </span>
                      )}
                      {element.type === 'gif' && (
                        <img src={element.content} alt="GIF" className="w-16 h-16 object-cover rounded" />
                      )}
                      {element.type === 'music' && (
                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <Music className="w-3 h-3" />
                          Music Added
                        </div>
                      )}
                    </div>
                  ))}

                  {textOverlay && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-center font-medium drop-shadow-lg">
                        {textOverlay}
                      </p>
                    </div>
                  )}

                  {isDrawingMode && (
                    <div className="absolute inset-0 bg-transparent cursor-crosshair">
                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Drawing Mode Active
                      </div>
                    </div>
                  )}
                </div>

                {/* Text overlay input */}
                <div>
                  <Label htmlFor="text-overlay">Caption (Optional)</Label>
                  <Textarea
                    id="text-overlay"
                    placeholder="Add a caption to your story..."
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    maxLength={150}
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {textOverlay.length}/150 characters
                  </p>
                </div>

                {/* Enhancement toggle and actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEnhancements(!showEnhancements)}
                    className="flex items-center gap-2"
                  >
                    <Smile className="w-4 h-4" />
                    Enhance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={uploading}
                  >
                    Reset
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

          {/* Enhancement panel */}
          {showEnhancements && file && (
            <div className="w-80 border-l pl-4 overflow-y-auto">
              <StoryEnhancementPanel
                onStickerSelect={handleStickerSelect}
                onTextAdd={handleTextAdd}
                onGifSelect={handleGifSelect}
                onMusicSelect={handleMusicSelect}
                onDrawingToggle={handleDrawingToggle}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryUpload;
