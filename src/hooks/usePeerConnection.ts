
import { useRef, useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UsePeerConnectionProps {
  isInitiator: boolean;
  onOfferCreated?: (offer: RTCSessionDescriptionInit) => void;
  onAnswerCreated?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidateGenerated?: (candidate: RTCIceCandidate) => void;
  remoteOffer?: RTCSessionDescriptionInit | null;
  remoteAnswer?: RTCSessionDescriptionInit | null;
  remoteIceCandidate?: RTCIceCandidate | null;
  localStream: MediaStream | null;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export const usePeerConnection = ({
  isInitiator,
  onOfferCreated,
  onAnswerCreated,
  onIceCandidateGenerated,
  remoteOffer,
  remoteAnswer,
  remoteIceCandidate,
  localStream,
  setRemoteStream,
}: UsePeerConnectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerConnectionReady, setIsPeerConnectionReady] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { toast } = useToast();

  const initializePeerConnection = useCallback(async () => {
    if (peerConnectionRef.current || !localStream) {
      console.log("PeerConnection already exists or no local stream");
      return;
    }

    console.log("Initializing new RTCPeerConnection");
    
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    localStream.getTracks().forEach((track) => {
      console.log("Adding track to peer connection:", track.kind);
      pc.addTrack(track, localStream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate");
        onIceCandidateGenerated?.(event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("Connection state changed:", state);
      setConnectionState(state);
      setIsConnected(state === 'connected');
      
      if (state === 'failed') {
        toast({
          title: "Connection Failed",
          description: "Video call connection failed. Please try again.",
          variant: "destructive",
        });
      } else if (state === 'connected') {
        toast({
          title: "Connected",
          description: "Video call connected successfully!",
        });
      }
    };

    setIsPeerConnectionReady(true);
    console.log("PeerConnection initialized successfully");
  }, [localStream, onIceCandidateGenerated, setRemoteStream, toast]);

  const createOfferIfInitiator = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !isInitiator) {
      console.log("Cannot create offer: no peer connection or not initiator");
      return;
    }

    try {
      console.log("Creating offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log("Offer created and set as local description");
      onOfferCreated?.(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        title: "Call Setup Failed",
        description: "Failed to initiate video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [isInitiator, onOfferCreated, toast]);

  // Handle remote offer
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteOffer || isInitiator) return;

    console.log("Processing remote offer");
    
    const processOffer = async () => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        console.log("Remote offer set successfully");
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Answer created and set as local description");
        
        onAnswerCreated?.(answer);
      } catch (error) {
        console.error("Error processing remote offer:", error);
        toast({
          title: "Call Setup Failed",
          description: "Failed to accept video call. Please try again.",
          variant: "destructive",
        });
      }
    };

    processOffer();
  }, [remoteOffer, isInitiator, onAnswerCreated, toast]);

  // Handle remote answer
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteAnswer || !isInitiator) return;

    console.log("Processing remote answer");
    
    const processAnswer = async () => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
        console.log("Remote answer set successfully");
      } catch (error) {
        console.error("Error processing remote answer:", error);
        toast({
          title: "Call Setup Failed",
          description: "Failed to establish video call connection.",
          variant: "destructive",
        });
      }
    };

    processAnswer();
  }, [remoteAnswer, isInitiator, toast]);

  // Handle remote ICE candidate
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteIceCandidate) return;

    console.log("Adding remote ICE candidate");
    
    const addCandidate = async () => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(remoteIceCandidate));
        console.log("Remote ICE candidate added successfully");
      } catch (error) {
        console.error("Error adding remote ICE candidate:", error);
      }
    };

    addCandidate();
  }, [remoteIceCandidate]);

  const cleanupPeerConnection = useCallback(() => {
    console.log("Cleaning up peer connection");
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsConnected(false);
    setIsPeerConnectionReady(false);
    setConnectionState('new');
    setRemoteStream(null);
    
    console.log("Peer connection cleanup complete");
  }, [setRemoteStream]);

  return {
    isConnected,
    isPeerConnectionReady,
    connectionState,
    peerConnectionRef,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupPeerConnection,
  };
};
