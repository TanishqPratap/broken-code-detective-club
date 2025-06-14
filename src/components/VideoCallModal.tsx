
import React from "react";
import VideoCallStatus from "@/components/VideoCallStatus";

interface VideoCallModalProps {
  children: React.ReactNode;
  setupStep: 'requesting-media' | 'initializing-connection' | 'ready';
  isConnected: boolean;
  connectionState: RTCPeerConnectionState;
  permissionError: string | null;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  children,
  setupStep,
  isConnected,
  connectionState,
  permissionError,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <VideoCallStatus
            setupStep={setupStep}
            isConnected={isConnected}
            connectionState={connectionState}
            permissionError={permissionError}
          />
        </div>
        {children}
      </div>
    </div>
  );
};

export default VideoCallModal;
