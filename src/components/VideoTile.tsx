
import React from "react";
import { VideoOff } from "lucide-react";

interface VideoTileProps {
  label: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  loading?: boolean;
  unavailable?: boolean;
  isMuted?: boolean;
  isFrontCamera?: boolean;
  isVideoEnabled?: boolean;
  backgroundClass?: string;
}

const VideoTile: React.FC<VideoTileProps> = ({
  label,
  videoRef,
  stream,
  loading,
  unavailable,
  isMuted,
  isFrontCamera,
  isVideoEnabled = true,
  backgroundClass = "bg-gray-900",
}) => {
  return (
    <div className={`relative rounded-lg overflow-hidden ${backgroundClass}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
        {label} {typeof isFrontCamera === "boolean" ? isFrontCamera ? "(Front)" : "(Back)" : null}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      )}
      {unavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white p-2 text-center">
          <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <span>Media access required. Please check browser permissions.</span>
        </div>
      )}
      {stream && !isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <VideoOff className="w-12 h-12 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default VideoTile;
