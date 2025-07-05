
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, Video, Mic, Timer, Zap } from "lucide-react";
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
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => handleClick("image/*,video/*,audio/*")} 
          disabled={uploadingMedia} 
          className="flex items-center gap-1"
        >
          <Paperclip className="w-3 h-3" />
          {uploadingMedia ? "Uploading..." : "Media"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => handleClick("image/*")} 
          disabled={uploadingMedia}
        >
          <Image className="w-3 h-3" />
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => handleClick("video/*")} 
          disabled={uploadingMedia}
        >
          <Video className="w-3 h-3" />
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => handleClick("audio/*")} 
          disabled={uploadingMedia}
        >
          <Mic className="w-3 h-3" />
        </Button>
      </div>
      
      <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
        isOneTimeMedia 
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <Checkbox 
          id="oneTimeMedia" 
          checked={isOneTimeMedia}
          onCheckedChange={(checked) => setIsOneTimeMedia(checked === true)}
          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
        />
        <label htmlFor="oneTimeMedia" className="flex items-center gap-2 cursor-pointer flex-1">
          <div className="flex items-center gap-2">
            {isOneTimeMedia ? (
              <div className="flex items-center gap-1 text-purple-700">
                <Zap className="w-4 h-4" />
                <Timer className="w-4 h-4" />
              </div>
            ) : (
              <Timer className="w-4 h-4 text-gray-500" />
            )}
            <span className={`text-sm font-medium ${
              isOneTimeMedia ? 'text-purple-700' : 'text-gray-600'
            }`}>
              View once
            </span>
          </div>
          {isOneTimeMedia && (
            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Snapchat style
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default MediaUploader;
