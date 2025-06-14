
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera, CameraOff } from "lucide-react";
import React from "react";

interface VideoCallControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isFrontCamera: boolean;
  isInitializing: boolean;
  hasMediaPermissions: boolean;
  localStreamPresent: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
}

const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isVideoEnabled,
  isAudioEnabled,
  isFrontCamera,
  isInitializing,
  hasMediaPermissions,
  localStreamPresent,
  onToggleVideo,
  onToggleAudio,
  onSwitchCamera,
  onEndCall,
}) => (
  <div className="flex justify-center gap-3 mt-4">
    <Button
      variant={isVideoEnabled ? "default" : "destructive"}
      size="sm"
      onClick={onToggleVideo}
      disabled={!hasMediaPermissions || !localStreamPresent}
      className="flex items-center gap-2"
    >
      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
      Video
    </Button>
    <Button
      variant={isAudioEnabled ? "default" : "destructive"}
      size="sm"
      onClick={onToggleAudio}
      disabled={!hasMediaPermissions || !localStreamPresent}
      className="flex items-center gap-2"
    >
      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      Audio
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={onSwitchCamera}
      disabled={!hasMediaPermissions || !localStreamPresent || !isVideoEnabled || isInitializing}
      className="flex items-center gap-2"
    >
      {isFrontCamera ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
      Switch Camera
    </Button>
    <Button
      variant="destructive"
      size="sm"
      onClick={onEndCall}
      className="flex items-center gap-2"
    >
      <PhoneOff className="w-4 h-4" />
      End Call
    </Button>
  </div>
);

export default VideoCallControls;
