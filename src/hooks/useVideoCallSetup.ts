
import { useRef, useEffect, useState, useCallback } from "react";
import { useMediaStream } from "@/hooks/useMediaStream";
import { usePeerConnection } from "@/hooks/usePeerConnection";

interface UseVideoCallSetupProps {
  isInitiator: boolean;
  onOfferCreated?: (offer: RTCSessionDescriptionInit) => void;
  onAnswerCreated?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidateGenerated?: (candidate: RTCIceCandidate) => void;
  remoteOffer?: RTCSessionDescriptionInit | null;
  remoteAnswer?: RTCSessionDescriptionInit | null;
  remoteIceCandidate?: RTCIceCandidate | null;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export const useVideoCallSetup = ({
  isInitiator,
  onOfferCreated,
  onAnswerCreated,
  onIceCandidateGenerated,
  remoteOffer,
  remoteAnswer,
  remoteIceCandidate,
  setRemoteStream,
}: UseVideoCallSetupProps) => {
  const [setupStep, setSetupStep] = useState<'requesting-media' | 'initializing-connection' | 'ready'>('requesting-media');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const setupInProgressRef = useRef(false);

  // Media/stream hook
  const mediaStream = useMediaStream();

  // PeerConnection hook
  const peerConnection = usePeerConnection({
    isInitiator,
    onOfferCreated,
    onAnswerCreated,
    onIceCandidateGenerated,
    remoteOffer,
    remoteAnswer,
    remoteIceCandidate,
    localStream: mediaStream.localStream,
    setRemoteStream,
  });

  // Main setup effect - run only once and track completion
  useEffect(() => {
    if (isSetupComplete || setupInProgressRef.current) return;

    setupInProgressRef.current = true;
    let mounted = true;

    const setupVideoCall = async () => {
      try {
        console.log("=== VideoCall Setup Starting ===");
        console.log("Current state:", {
          setupStep,
          hasLocalStream: !!mediaStream.localStream,
          hasMediaPermissions: mediaStream.hasMediaPermissions,
          isInitializing: mediaStream.isInitializing,
          isPeerConnectionReady: peerConnection.isPeerConnectionReady,
          isInitiator
        });

        // Step 1: Request media permissions if needed
        if (!mediaStream.localStream && !mediaStream.isInitializing && !mediaStream.hasMediaPermissions) {
          console.log("Step 1: Requesting media permissions");
          setSetupStep('requesting-media');
          
          try {
            await mediaStream.requestMediaPermissions();
            if (!mounted) return;
          } catch (error) {
            console.error("Failed to get media permissions:", error);
            setupInProgressRef.current = false;
            return;
          }
        }

        // Step 2: Initialize peer connection once we have media
        if (mediaStream.localStream && !peerConnection.isPeerConnectionReady && !mediaStream.isInitializing) {
          console.log("Step 2: Initializing peer connection");
          setSetupStep('initializing-connection');
          
          try {
            await peerConnection.initializePeerConnection();
            if (!mounted) return;
          } catch (error) {
            console.error("Failed to initialize peer connection:", error);
            setupInProgressRef.current = false;
            return;
          }
        }

        // Step 3: Complete setup and create offer if initiator
        if (mediaStream.localStream && peerConnection.isPeerConnectionReady && !isSetupComplete) {
          console.log("Step 3: Completing setup");
          setSetupStep('ready');
          setIsSetupComplete(true);
          setupInProgressRef.current = false;
          
          if (isInitiator) {
            // Small delay to ensure everything is ready
            setTimeout(() => {
              if (mounted) {
                peerConnection.createOfferIfInitiator();
              }
            }, 100);
          }
        }

      } catch (error) {
        console.error("Error in video call setup:", error);
        setupInProgressRef.current = false;
      }
    };

    setupVideoCall();

    return () => {
      mounted = false;
    };
  }, [
    mediaStream.localStream,
    mediaStream.hasMediaPermissions,
    peerConnection.isPeerConnectionReady,
    isSetupComplete,
    mediaStream.isInitializing
  ]);

  const resetSetup = useCallback(() => {
    setIsSetupComplete(false);
    setupInProgressRef.current = false;
  }, []);

  return {
    setupStep,
    isSetupComplete,
    resetSetup,
    mediaStream,
    peerConnection,
  };
};
