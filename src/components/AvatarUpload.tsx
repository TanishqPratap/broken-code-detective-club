
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  displayName?: string | null;
  username: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

const AvatarUpload = ({ 
  currentAvatarUrl, 
  userId, 
  displayName, 
  username, 
  onAvatarUpdate 
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      console.log('Upload started, event target files:', event.target.files);

      if (!event.target.files || event.target.files.length === 0) {
        console.log('No files selected');
        return; // Don't throw error, just return silently
      }

      const file = event.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB.');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      console.log('Uploading to path:', filePath);

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully');

      // Get public URL with cache busting parameter
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add timestamp to force browser to reload the image
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log('Public URL generated:', publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');
      onAvatarUpdate(publicUrl);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      });

      // Clear the input value to allow re-uploading the same file
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCameraClick = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="relative">
      <Avatar className="w-24 h-24">
        <AvatarImage src={currentAvatarUrl || ""} />
        <AvatarFallback className="text-2xl">
          {displayName?.[0] || username[0] || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="absolute -bottom-2 -right-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full w-8 h-8 p-0"
          disabled={uploading}
          onClick={handleCameraClick}
          type="button"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>
        
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AvatarUpload;
