// VideoCall composed from custom hooks and components

import { useRef, useEffect, useState, useCallback } from "react"; // Added useCallback
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
    isInitializing, // Renamed from isInitializingMedia for clarity if used
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
    const setupCall = async () => {
      // Phase 1: Ensure localStream is available
      if (!localStream) {
        if (!isInitializing) { // isInitializing is from useMediaStream
          console.log("VideoCall: No local stream, requesting permissions.");
          try {
            // requestMediaPermissions updates localStream in useMediaStream hook,
            // which will cause VideoCall to re-render with the new localStream.
            // This effect will then run again.
            await requestMediaPermissions(isFrontCamera ? "user" : "environment");
            return; // Important: Exit and let the effect re-run with the new localStream
          } catch (error) {
            console.error("VideoCall: Failed to get media permissions.", error);
            onClose(); // Close if media permissions fail
            return;
          }
        } else {
          console.log("VideoCall: Media is already initializing, waiting.");
          return; // Still initializing, wait for it to complete and re-render
        }
      }

      // Phase 2: Initialize peer connection if localStream is available
      // Check if peer connection needs to be initialized or is closed.
      if (!peerConnectionRef.current || peerConnectionRef.current.connectionState === 'closed') {
        console.log("VideoCall: Local stream available. Initializing peer connection.");
        await initializePeerConnection(); // Uses the localStream prop passed to usePeerConnection
                                          // This will set isPeerConnectionReady to true and trigger re-render / re-run of this effect.
      }
      
      // Phase 3: Create offer if initiator and peer connection is ready and stable
      // isPeerConnectionReady ensures that initializePeerConnection has set up the pc object.
      if (isInitiator && localStream && isPeerConnectionReady && peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
        console.log("VideoCall: Initiator, localStream and PC ready. Creating offer.");
        await createOfferIfInitiator();
      }
    };

    setupCall();

    // Cleanup function: This will be returned by the effect and run when the component unmounts
    // or before the effect runs again if dependencies change.
    return () => {
      console.log("VideoCall: Cleanup effect.");
      // cleanupStream and cleanupPeerConnection should be designed to be safe to call multiple times
      // or to correctly stop ongoing processes.
      cleanupStream();
      cleanupPeerConnection();
      setRemoteStream(null); // Reset remote stream state
    };
  }, [
    localStream,
    isInitiator,
    isFrontCamera,
    isInitializing, // From useMediaStream, indicates if requestMediaPermissions is in progress
    isPeerConnectionReady, // From usePeerConnection
    requestMediaPermissions,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupStream,
    cleanupPeerConnection,
    onClose,
    peerConnectionRef, // The ref object itself is stable. Used to check .current.connectionState
  ]);


  // End call handler
  const handleEndCall = useCallback(() => { // Wrapped in useCallback
    // Cleanup functions are called by the useEffect cleanup
    onClose(); // Call the parent's onClose handler
  }, [onClose]);

  if (isInitializing && !localStream && !hasMediaPermissions) { // More precise loading state
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Requesting media permissions...</p>
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
                  : isPeerConnectionReady && peerConnectionRef.current?.connectionState !== 'closed'
                  ? "text-yellow-600 bg-yellow-100"
                  : "text-red-600 bg-red-100"
              }`}
            >
              {isConnected
                ? "Connected"
                : isPeerConnectionReady && peerConnectionRef.current?.connectionState !== 'closed'
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
              loading={!remoteStream && peerConnectionRef.current?.connectionState !== "connected" && isConnected === false}
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
              loading={isInitializing && !localStream} // Show loading if media is initializing
              unavailable={!hasMediaPermissions && !isInitializing} // Show unavailable if no permissions and not initializing
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
          isInitializing={isInitializing || (localStream !== null && !isPeerConnectionReady)} // Consider initializing if stream exists but PC not ready
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
