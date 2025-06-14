
import { useRef, useEffect, useState, useCallback } from "react";
import { useVideoCallSetup } from "@/hooks/useVideoCallSetup";
import VideoTile from "@/components/VideoTile";
import VideoCallControls from "@/components/VideoCallControls";
import VideoCallModal from "@/components/VideoCallModal";
import VideoCallLoadingScreen from "@/components/VideoCallLoadingScreen";

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

  const {
    setupStep,
    isSetupComplete,
    resetSetup,
    mediaStream,
    peerConnection,
  } = useVideoCallSetup({
    isInitiator,
    onOfferCreated,
    onAnswerCreated,
    onIceCandidateGenerated,
    remoteOffer,
    remoteAnswer,
    remoteIceCandidate,
    setRemoteStream,
  });

  // Set up video elements
  useEffect(() => {
    if (localVideoRef.current && mediaStream.localStream) {
      console.log("Setting local video element source");
      localVideoRef.current.srcObject = mediaStream.localStream;
    }
  }, [mediaStream.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video element source");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log("=== VideoCall Component Unmount Cleanup ===");
      mediaStream.cleanupStream();
      peerConnection.cleanupPeerConnection();
      setRemoteStream(null);
    };
  }, [mediaStream.cleanupStream, peerConnection.cleanupPeerConnection]);

  // End call handler
  const handleEndCall = useCallback(() => {
    console.log("Ending video call");
    onClose();
  }, [onClose]);

  // Handle retry for permissions
  const handleRetry = useCallback(() => {
    resetSetup();
    mediaStream.requestMediaPermissions();
  }, [resetSetup, mediaStream.requestMediaPermissions]);

  // Show loading/error screens
  const showLoadingScreen = setupStep === 'requesting-media' && mediaStream.isInitializing;
  const showErrorScreen = mediaStream.permissionError && !mediaStream.hasMediaPermissions && !mediaStream.localStream;

  if (showLoadingScreen || showErrorScreen) {
    return (
      <VideoCallLoadingScreen
        isRequesting={showLoadingScreen}
        permissionError={mediaStream.permissionError}
        onRetry={handleRetry}
        onCancel={handleEndCall}
      />
    );
  }

  return (
    <VideoCallModal
      setupStep={setupStep}
      isConnected={peerConnection.isConnected}
      connectionState={peerConnection.connectionState}
      permissionError={mediaStream.permissionError}
    >
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Remote video */}
        <div className="flex-1">
          <VideoTile
            label="Remote"
            videoRef={remoteVideoRef}
            stream={remoteStream}
            loading={!remoteStream && (peerConnection.connectionState === 'connecting' || setupStep !== 'ready')}
            unavailable={false}
            isMuted={false}
          />
        </div>
        {/* Local video */}
        <div className="w-80">
          <VideoTile
            label="You"
            videoRef={localVideoRef}
            stream={mediaStream.localStream}
            loading={mediaStream.isInitializing}
            unavailable={!mediaStream.hasMediaPermissions && !mediaStream.isInitializing}
            isMuted={true}
            isFrontCamera={mediaStream.isFrontCamera}
            isVideoEnabled={mediaStream.isVideoEnabled}
          />
        </div>
      </div>

      {/* Controls */}
      <VideoCallControls
        isVideoEnabled={mediaStream.isVideoEnabled}
        isAudioEnabled={mediaStream.isAudioEnabled}
        isFrontCamera={mediaStream.isFrontCamera}
        isInitializing={mediaStream.isInitializing || setupStep !== 'ready'}
        hasMediaPermissions={mediaStream.hasMediaPermissions}
        localStreamPresent={!!mediaStream.localStream}
        onToggleVideo={mediaStream.toggleVideo}
        onToggleAudio={mediaStream.toggleAudio}
        onSwitchCamera={mediaStream.switchCamera}
        onEndCall={handleEndCall}
      />
    </VideoCallModal>
  );
};

export default VideoCall;
