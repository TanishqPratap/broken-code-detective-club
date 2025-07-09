
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, Palette, Music, Smile, Images } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StoryEnhancementPanel from "./StoryEnhancementPanel";
import MultiImageStoryEditor from "./MultiImageStoryEditor";

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

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

const StoryUpload = ({ onStoryUploaded }: StoryUploadProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isMultiImage, setIsMultiImage] = useState(false);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [textOverlay, setTextOverlay] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    console.log('Files selected:', selectedFiles.length);
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(file => 
      !file.type.startsWith('image/') && !file.type.startsWith('video/')
    );
    
    if (invalidFiles.length > 0) {
      toast.error("Please select only image or video files");
      return;
    }

    // Validate file sizes (max 50MB each)
    const oversizedFiles = selectedFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Each file must be less than 50MB");
      return;
    }

    // Check if multiple images are selected
    if (selectedFiles.length > 1) {
      const hasVideo = selectedFiles.some(file => file.type.startsWith('video/'));
      if (hasVideo) {
        toast.error("Cannot mix videos with other files in multi-image stories");
        return;
      }
      
      const allImages = selectedFiles.every(file => file.type.startsWith('image/'));
      if (!allImages) {
        toast.error("Multi-file stories only support images");
        return;
      }
      
      setIsMultiImage(true);
      setFiles(selectedFiles);
      setPreview(null);
    } else {
      // Single file
      const file = selectedFiles[0];
      setIsMultiImage(false);
      setFiles([file]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

  const createMultiImageStory = async () => {
    if (!user || files.length === 0) return;

    try {
      setUploading(true);
      
      // Create a canvas to combine multiple images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = 400;
      canvas.height = 600;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw each image element
      for (const element of imageElements) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = element.src;
        });
        
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.scale(element.scale, element.scale);
        ctx.drawImage(
          img,
          -element.width / 2,
          -element.height / 2,
          element.width,
          element.height
        );
        ctx.restore();
      }
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.9);
      });
      
      // Upload the combined image
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(filePath);
      
      await saveStoryToDatabase(publicUrl, 'image');
      
    } catch (error) {
      console.error('Error creating multi-image story:', error);
      toast.error("Failed to create story");
    }
  };

  const uploadSingleStory = async () => {
    if (!user || files.length === 0) return;
    
    try {
      setUploading(true);
      const file = files[0];
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(filePath);

      await saveStoryToDatabase(publicUrl, file.type.startsWith('image/') ? 'image' : 'video');
      
    } catch (error) {
      console.error('Error uploading single story:', error);
      toast.error("Failed to upload story");
    }
  };

  const saveStoryToDatabase = async (mediaUrl: string, contentType: string) => {
    const storyMetadata = {
      elements: storyElements,
      textOverlay: textOverlay || null,
      hasDrawing: isDrawingMode,
      isMultiImage: isMultiImage,
      imageElements: isMultiImage ? imageElements : undefined
    };

    const { error: dbError } = await supabase
      .from('stories')
      .insert({
        creator_id: user!.id,
        media_url: mediaUrl,
        content_type: contentType,
        text_overlay: JSON.stringify(storyMetadata),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    if (dbError) throw dbError;

    toast.success("Story uploaded successfully!");
    resetForm();
    setIsOpen(false);
    
    if (onStoryUploaded) {
      onStoryUploaded();
    }
  };

  const uploadStory = async () => {
    if (isMultiImage) {
      await createMultiImageStory();
    } else {
      await uploadSingleStory();
    }
    setUploading(false);
  };

  const resetForm = () => {
    setFiles([]);
    setPreview(null);
    setTextOverlay("");
    setStoryElements([]);
    setImageElements([]);
    setIsDrawingMode(false);
    setShowEnhancements(false);
    setIsMultiImage(false);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-[70vh]">
          {/* Main content area */}
          <div className="flex-1 space-y-4">
            {files.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload images or video for your story
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Select multiple images to create a collage story
                </p>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="story-upload"
                  multiple
                />
                <Label htmlFor="story-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span className="flex items-center gap-2">
                      <Images className="w-4 h-4" />
                      Choose Files
                    </span>
                  </Button>
                </Label>
              </div>
            ) : (
              <div className="space-y-4 h-full">
                {/* Preview area */}
                <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
                  {isMultiImage ? (
                    <MultiImageStoryEditor
                      images={files}
                      onImagesChange={setImageElements}
                      canvasWidth={400}
                      canvasHeight={600}
                    />
                  ) : (
                    <>
                      {files[0].type.startsWith('image/') ? (
                        <img src={preview || ''} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <video src={preview || ''} className="w-full h-full object-cover" controls />
                      )}
                      
                      {/* Render story elements overlay for single images */}
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
                    </>
                  )}

                  {textOverlay && !isMultiImage && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-center font-medium drop-shadow-lg">
                        {textOverlay}
                      </p>
                    </div>
                  )}

                  {isDrawingMode && !isMultiImage && (
                    <div className="absolute inset-0 bg-transparent cursor-crosshair">
                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Drawing Mode Active
                      </div>
                    </div>
                  )}
                </div>

                {/* Text overlay input - only for single images */}
                {!isMultiImage && (
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
                )}

                {/* Enhancement toggle and actions */}
                <div className="flex gap-2">
                  {!isMultiImage && (
                    <Button
                      variant="outline"
                      onClick={() => setShowEnhancements(!showEnhancements)}
                      className="flex items-center gap-2"
                    >
                      <Smile className="w-4 h-4" />
                      Enhance
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={uploading}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={uploadStory}
                    disabled={uploading || (isMultiImage && imageElements.length === 0)}
                    className="flex-1"
                  >
                    {uploading ? "Uploading..." : "Share Story"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Enhancement panel - only for single images */}
          {showEnhancements && files.length > 0 && !isMultiImage && (
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
