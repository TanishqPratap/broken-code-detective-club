
import { useRef, useEffect, useState, useCallback } from "react";
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
  const [setupStep, setSetupStep] = useState<'requesting-media' | 'initializing-connection' | 'ready'>('requesting-media');
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Media/stream hook
  const {
    localStream,
    requestMediaPermissions,
    isVideoEnabled,
    isAudioEnabled,
    isFrontCamera,
    hasMediaPermissions,
    isInitializing,
    permissionError,
    toggleVideo,
    toggleAudio,
    switchCamera,
    cleanupStream,
  } = useMediaStream();

  // PeerConnection hook
  const {
    isConnected,
    isPeerConnectionReady,
    connectionState,
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
      console.log("Setting local video element source");
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video element source");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Main setup effect
  useEffect(() => {
    let mounted = true;

    const setupVideoCall = async () => {
      try {
        console.log("=== VideoCall Setup Starting ===");
        console.log("Current state:", {
          setupStep,
          hasLocalStream: !!localStream,
          hasMediaPermissions,
          isInitializing,
          isPeerConnectionReady,
          isInitiator
        });

        // Step 1: Request media permissions
        if (!localStream && !isInitializing && !hasMediaPermissions) {
          console.log("Step 1: Requesting media permissions");
          setSetupStep('requesting-media');
          
          try {
            await requestMediaPermissions(isFrontCamera ? "user" : "environment");
            if (!mounted) return;
          } catch (error) {
            console.error("Failed to get media permissions:", error);
            if (!mounted) return;
            // Continue without closing - let user try again or use without video
            return;
          }
        }

        // Step 2: Initialize peer connection once we have media
        if (localStream && !isPeerConnectionReady && !isInitializing) {
          console.log("Step 2: Initializing peer connection");
          setSetupStep('initializing-connection');
          
          try {
            await initializePeerConnection();
            if (!mounted) return;
          } catch (error) {
            console.error("Failed to initialize peer connection:", error);
            if (!mounted) return;
            return;
          }
        }

        // Step 3: Create offer if we're the initiator
        if (localStream && isPeerConnectionReady && isInitiator && !isInitializing) {
          console.log("Step 3: Creating offer (initiator)");
          setSetupStep('ready');
          
          // Small delay to ensure everything is ready
          setTimeout(() => {
            if (mounted) {
              createOfferIfInitiator();
            }
          }, 100);
        } else if (localStream && isPeerConnectionReady && !isInitiator) {
          console.log("Step 3: Ready to receive offer (non-initiator)");
          setSetupStep('ready');
        }

      } catch (error) {
        console.error("Error in video call setup:", error);
      }
    };

    setupVideoCall();

    // Cleanup function
    return () => {
      mounted = false;
      console.log("=== VideoCall Cleanup ===");
      cleanupStream();
      cleanupPeerConnection();
      setRemoteStream(null);
    };
  }, [
    localStream,
    hasMediaPermissions,
    isInitializing,
    isPeerConnectionReady,
    isInitiator,
    isFrontCamera,
    requestMediaPermissions,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupStream,
    cleanupPeerConnection,
    setupStep
  ]);

  // End call handler
  const handleEndCall = useCallback(() => {
    console.log("Ending video call");
    onClose();
  }, [onClose]);

  // Show loading screen during initial setup
  if (setupStep === 'requesting-media' && isInitializing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Setting Up Video Call</h3>
          <p className="text-gray-600 mb-4">Requesting camera and microphone permissions...</p>
          <p className="text-sm text-gray-500">
            Please allow access when prompted by your browser
          </p>
        </div>
      </div>
    );
  }

  // Show error if media permissions failed
  if (permissionError && !hasMediaPermissions && !localStream) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Media Access Required</h3>
          <p className="text-gray-600 mb-4">{permissionError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => requestMediaPermissions()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Try Again
            </button>
            <button
              onClick={handleEndCall}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
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
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Remote video */}
          <div className="flex-1">
            <VideoTile
              label="Remote"
              videoRef={remoteVideoRef}
              stream={remoteStream}
              loading={!remoteStream && (connectionState === 'connecting' || setupStep !== 'ready')}
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
              loading={isInitializing}
              unavailable={!hasMediaPermissions && !isInitializing}
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
          isInitializing={isInitializing || setupStep !== 'ready'}
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
