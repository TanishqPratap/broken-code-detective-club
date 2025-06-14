
// VideoCall composed from custom hooks and components

import { useRef, useEffect, useState } from "react";
import { useMediaStream } from "@/hooks/useMediaStream";
import { usePeerConnection } from "@/hooks/usePeerConnection";
import VideoTile from "@/components/VideoTile";
import VideoCallControls from "@/components/VideoCallControls";

interface VideoCallProps {
  isInitiator: boolean;
  onClose: () => void;
  onOfferCreated?: (offer: RTCSessionDescriptionInit) => void;
  onAnswerCreated?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidateGenerated?: (candidate: RTCIceCandidate) => void;
  remoteOffer?: RTCSessionDescriptionInit | null;
  remoteAnswer?: RTCSessionDescriptionInit | null;
  remoteIceCandidate?: RTCIceCandidate | null;
}

const VideoCall = ({
  isInitiator,
  onClose,
  onOfferCreated,
  onAnswerCreated,
  onIceCandidateGenerated,
  remoteOffer,
  remoteAnswer,
  remoteIceCandidate,
}: VideoCallProps) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Media/stream
  const {
    localStream,
    requestMediaPermissions,
    isVideoEnabled,
    isAudioEnabled,
    isFrontCamera,
    hasMediaPermissions,
    isInitializing,
    toggleVideo,
    toggleAudio,
    switchCamera,
    cleanupStream,
  } = useMediaStream();

  // PeerConnection
  const {
    isConnected,
    isPeerConnectionReady,
    peerConnectionRef,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupPeerConnection,
  } = usePeerConnection({
    isInitiator,
    onOfferCreated,
    onAnswerCreated,
    onIceCandidateGenerated,
    remoteOffer,
    remoteAnswer,
    remoteIceCandidate,
    localStream,
    setRemoteStream,
  });

  // Set up video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize call setup and peer connection
  useEffect(() => {
    const start = async () => {
      await requestMediaPermissions(isFrontCamera ? "user" : "environment");
      await initializePeerConnection();
      if (isInitiator) {
        await createOfferIfInitiator();
      }
    };
    start();
    return () => {
      cleanupStream();
      cleanupPeerConnection();
      setRemoteStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrontCamera]);

  // End call handler
  const handleEndCall = () => {
    cleanupStream();
    cleanupPeerConnection();
    setRemoteStream(null);
    onClose();
  };

  if (isInitializing && !localStream) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Setting up video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <div className="flex items-center gap-2">
            {isInitializing && localStream && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                Initializing...
              </div>
            )}
            <span
              className={`text-sm px-2 py-1 rounded ${
                isConnected
                  ? "text-green-600 bg-green-100"
                  : isPeerConnectionReady
                  ? "text-yellow-600 bg-yellow-100"
                  : "text-red-600 bg-red-100"
              }`}
            >
              {isConnected
                ? "Connected"
                : isPeerConnectionReady
                ? (peerConnectionRef.current?.connectionState || "Connecting...")
                : "Initializing Media..."}
            </span>
            {!hasMediaPermissions && (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                Media access limited
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Remote video */}
          <div className="flex-1">
            <VideoTile
              label="Remote"
              videoRef={remoteVideoRef}
              stream={remoteStream}
              loading={!remoteStream && peerConnectionRef.current?.connectionState !== "connected"}
              unavailable={false}
              isMuted={false}
            />
          </div>
          {/* Local video */}
          <div className="w-80">
            <VideoTile
              label="You"
              videoRef={localVideoRef}
              stream={localStream}
              loading={!localStream && hasMediaPermissions}
              unavailable={!hasMediaPermissions}
              isMuted={true}
              isFrontCamera={isFrontCamera}
              isVideoEnabled={isVideoEnabled}
            />
          </div>
        </div>

        {/* Controls */}
        <VideoCallControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isFrontCamera={isFrontCamera}
          isInitializing={isInitializing}
          hasMediaPermissions={hasMediaPermissions}
          localStreamPresent={!!localStream}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onSwitchCamera={switchCamera}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
};

export default VideoCall;
