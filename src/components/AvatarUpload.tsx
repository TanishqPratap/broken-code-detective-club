
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

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
          asChild
        >
          <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </label>
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
