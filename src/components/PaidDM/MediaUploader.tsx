
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, Video, Mic, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface MediaUploaderProps {
  uploadingMedia: boolean;
  onUpload: (file: File, isOneTime?: boolean) => Promise<void>;
}

const MediaUploader = ({ uploadingMedia, onUpload }: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOneTimeMedia, setIsOneTimeMedia] = useState(false);

  // Accept prop needs to be dynamically set before each click, so handlers:
  const handleClick = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.value = ""; // reset selection
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, isOneTimeMedia);
      setIsOneTimeMedia(false); // Reset after upload
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => handleClick("image/*,video/*,audio/*")} disabled={uploadingMedia} className="flex items-center gap-1">
          <Paperclip className="w-3 h-3" />
          {uploadingMedia ? "Uploading..." : "Media"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => handleClick("image/*")} disabled={uploadingMedia}>
          <Image className="w-3 h-3" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => handleClick("video/*")} disabled={uploadingMedia}>
          <Video className="w-3 h-3" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => handleClick("audio/*")} disabled={uploadingMedia}>
          <Mic className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="oneTimeMedia" 
          checked={isOneTimeMedia}
          onCheckedChange={(checked) => setIsOneTimeMedia(checked === true)}
        />
        <label htmlFor="oneTimeMedia" className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
          {isOneTimeMedia ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          One-time view
        </label>
      </div>
    </div>
  );
};

export default MediaUploader;
