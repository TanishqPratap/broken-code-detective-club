import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Play, Pause, Music, Palette, Type } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StoryEnhancementPanel from "./StoryEnhancementPanel";
import SpotifyMusicSelector from "./SpotifyMusicSelector";

interface VibesUploadProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  external_url: string;
  duration_ms: number;
  image: string;
}

const VibesUpload = ({ onUploadComplete, onClose }: VibesUploadProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<SpotifyTrack | null>(null);
  const [textOverlays, setTextOverlays] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);
        toast.success('Video selected successfully!');
      } else {
        toast.error('Please select a video file');
      }
    }
  };

  const syncAudioWithVideo = () => {
    if (videoRef.current && audioRef.current && selectedMusic?.preview_url) {
      const video = videoRef.current;
      const audio = audioRef.current;
      
      // Sync audio currentTime with video
      audio.currentTime = video.currentTime;
      
      if (isPlaying) {
        audio.play().catch(console.error);
        video.play().catch(console.error);
      } else {
        audio.pause();
        video.pause();
      }
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play().catch(console.error);
        if (selectedMusic?.preview_url && audioRef.current) {
          audioRef.current.currentTime = videoRef.current.currentTime;
          audioRef.current.play().catch(console.error);
        }
      } else {
        videoRef.current.pause();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  };

  const handleStickerSelect = (sticker: string) => {
    const newSticker = {
      id: Date.now().toString(),
      type: 'sticker',
      content: sticker,
      position: { x: 50, y: 50 }
    };
    setStickers(prev => [...prev, newSticker]);
    setMetadata(prev => ({
      ...prev,
      stickers: [...(prev.stickers || []), newSticker]
    }));
    toast.success('Sticker added!');
  };

  const handleTextAdd = (text: string, style: any) => {
    const newText = {
      id: Date.now().toString(),
      type: 'text',
      content: text,
      style,
      position: { x: 50, y: 30 }
    };
    setTextOverlays(prev => [...prev, newText]);
    setMetadata(prev => ({
      ...prev,
      textOverlays: [...(prev.textOverlays || []), newText]
    }));
    toast.success('Text overlay added!');
  };

  const handleGifSelect = (gif: string) => {
    const newGif = {
      id: Date.now().toString(),
      type: 'gif',
      content: gif,
      position: { x: 50, y: 70 }
    };
    setStickers(prev => [...prev, newGif]);
    setMetadata(prev => ({
      ...prev,
      gifs: [...(prev.gifs || []), newGif]
    }));
    toast.success('GIF added!');
  };

  const handleMusicSelect = (track: SpotifyTrack) => {
    setSelectedMusic(track);
    setMetadata(prev => ({
      ...prev,
      music: track
    }));
    
    // Create new audio element for the selected track only if preview is available
    if (track.preview_url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(track.preview_url);
      audio.volume = 0.7;
      audio.loop = true;
      audioRef.current = audio;
      
      // Sync with video if playing
      if (isPlaying && videoRef.current) {
        audio.currentTime = videoRef.current.currentTime;
        audio.play().catch(console.error);
      }
      
      toast.success(`"${track.name}" by ${track.artist} added to your vibe with preview!`);
    } else {
      // Clean up any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      toast.success(`"${track.name}" by ${track.artist} added to your vibe! (Preview not available, but track info will be shown)`);
    }
  };

  const handleDrawingToggle = () => {
    toast.info("Drawing mode would be implemented here");
  };

  const uploadVideo = async (file: File): Promise<string> => {
    console.log('Starting video upload:', file.name, file.size);
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);
    return publicUrl;
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please sign in to upload vibes');
      return;
    }

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting vibe upload process...');
      toast.info('Uploading your vibe...');

      // Upload video file
      const mediaUrl = await uploadVideo(videoFile);
      console.log('Video uploaded, URL:', mediaUrl);

      // Get video duration
      let duration = 0;
      if (videoRef.current && !isNaN(videoRef.current.duration)) {
        duration = Math.floor(videoRef.current.duration) || 0;
      }

      // Prepare hashtags
      const processedHashtags = hashtags.split('#')
        .filter(tag => tag.trim())
        .map(tag => tag.trim());

      // Prepare metadata with better structure
      const vibeMetadata = {
        hashtags: processedHashtags,
        effects: {
          music: selectedMusic,
          textOverlays: textOverlays,
          stickers: stickers
        },
        ...metadata
      };

      const postData = {
        user_id: user.id,
        content_type: 'reel',
        description: description.trim(),
        media_url: mediaUrl,
        media_type: videoFile.type,
        duration,
        metadata: vibeMetadata
      };

      console.log('Creating vibe post with data:', postData);

      // Create the vibe post
      const { data: result, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        
        // Handle specific errors
        if (postError.code === '23505') {
          throw new Error('Duplicate post detected. Please try again.');
        } else if (postError.code === '42501') {
          throw new Error('Permission denied. Please check your authentication.');
        } else if (postError.message?.includes('violates row-level security')) {
          throw new Error('Authentication error. Please sign out and sign in again.');
        } else if (postError.message?.includes('column') && postError.message?.includes('does not exist')) {
          throw new Error('Database error. Some features may not be available yet.');
        } else {
          throw new Error(`Failed to create post: ${postError.message}`);
        }
      }

      console.log('Vibe post created successfully:', result);
      toast.success('Vibe uploaded successfully! 🎉');
      
      // Reset form
      setDescription('');
      setHashtags('');
      setVideoFile(null);
      setVideoPreview(null);
      setSelectedMusic(null);
      setTextOverlays([]);
      setStickers([]);
      setMetadata({});
      setIsPlaying(false);
      setShowEnhancements(false);
      setShowMusicSelector(false);
      
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Call callbacks
      onUploadComplete?.();
      onClose?.();
      
    } catch (error: any) {
      console.error('Error uploading vibe:', error);
      toast.error(error.message || 'Failed to upload vibe. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Create Vibe
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Video</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {videoPreview ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full max-w-xs mx-auto rounded-lg"
                    controls={false}
                    muted
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }}
                    onTimeUpdate={syncAudioWithVideo}
                    onError={(e) => {
                      console.error('Video error:', e);
                      toast.error('Error loading video preview');
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={togglePlayPause}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </Button>
                  </div>
                  
                  {/* Preview overlays */}
                  {textOverlays.map(text => (
                    <div
                      key={text.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${text.position.x}%`,
                        top: `${text.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        color: text.style?.color || '#ffffff',
                        fontSize: `${text.style?.fontSize || 16}px`,
                        fontWeight: text.style?.fontWeight || 'normal'
                      }}
                    >
                      {text.content}
                    </div>
                  ))}
                  
                  {stickers.map(sticker => (
                    <div
                      key={sticker.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${sticker.position.x}%`,
                        top: `${sticker.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {sticker.type === 'sticker' && (
                        <span className="text-2xl">{sticker.content}</span>
                      )}
                      {sticker.type === 'gif' && (
                        <img src={sticker.content} alt="GIF" className="w-16 h-16 object-cover rounded" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload video</p>
                  <p className="text-sm text-gray-400">MP4, MOV, AVI up to 100MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-4"
                disabled={uploading}
              >
                {videoFile ? 'Change Video' : 'Select Video'}
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Write a caption for your vibe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={uploading}
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              placeholder="#trending #viral #fun"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Enhancement Tools */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnhancements(!showEnhancements)}
              disabled={uploading}
            >
              <Palette className="w-4 h-4 mr-2" />
              Effects
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMusicSelector(!showMusicSelector)}
              disabled={uploading}
            >
              <Music className="w-4 h-4 mr-2" />
              Add Music
            </Button>
            {selectedMusic && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Music className="w-4 h-4" />
                <span className="truncate max-w-40">
                  {selectedMusic.name} - {selectedMusic.artist}
                  {!selectedMusic.preview_url && " (No preview)"}
                </span>
              </div>
            )}
            {textOverlays.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Type className="w-4 h-4" />
                {textOverlays.length} text{textOverlays.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !videoFile || !description.trim()}
            className="w-full"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading Vibe...
              </div>
            ) : (
              'Share Vibe'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Music Selector */}
      {showMusicSelector && (
        <Card>
          <CardContent className="p-6">
            <SpotifyMusicSelector
              onTrackSelect={handleMusicSelect}
              selectedTrack={selectedMusic}
            />
          </CardContent>
        </Card>
      )}

      {/* Enhancement Panel */}
      {showEnhancements && (
        <StoryEnhancementPanel
          onStickerSelect={handleStickerSelect}
          onTextAdd={handleTextAdd}
          onGifSelect={handleGifSelect}
          onMusicSelect={() => {}} // We handle music through SpotifyMusicSelector now
          onDrawingToggle={handleDrawingToggle}
        />
      )}
    </div>
  );
};

export default VibesUpload;
