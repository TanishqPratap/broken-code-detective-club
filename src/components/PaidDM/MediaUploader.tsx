
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, Video, Mic } from "lucide-react";

interface MediaUploaderProps {
  uploadingMedia: boolean;
  onUpload: (file: File) => Promise<void>;
}

const MediaUploader = ({ uploadingMedia, onUpload }: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Accept prop needs to be dynamically set before each click, so handlers:
  const handleClick = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.value = ""; // reset selection
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
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
  );
};

export default MediaUploader;
