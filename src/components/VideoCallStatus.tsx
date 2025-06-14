
import React from "react";

interface VideoCallStatusProps {
  setupStep: 'requesting-media' | 'initializing-connection' | 'ready';
  isConnected: boolean;
  connectionState: RTCPeerConnectionState;
  permissionError: string | null;
}

const VideoCallStatus: React.FC<VideoCallStatusProps> = ({
  setupStep,
  isConnected,
  connectionState,
  permissionError,
}) => {
  return (
    <div className="flex items-center gap-2">
      {setupStep !== 'ready' && (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
          {setupStep === 'requesting-media' ? 'Getting media...' : 
           setupStep === 'initializing-connection' ? 'Connecting...' : 'Setting up...'}
        </div>
      )}
      <span
        className={`text-sm px-2 py-1 rounded ${
          isConnected
            ? "text-green-600 bg-green-100"
            : connectionState === 'connecting'
            ? "text-yellow-600 bg-yellow-100"
            : "text-red-600 bg-red-100"
        }`}
      >
        {isConnected
          ? "Connected"
          : connectionState === 'connecting'
          ? "Connecting..."
          : connectionState === 'new'
          ? "Initializing..."
          : connectionState || "Disconnected"}
      </span>
      {permissionError && (
        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
          {permissionError}
        </span>
      )}
    </div>
  );
};

export default VideoCallStatus;
