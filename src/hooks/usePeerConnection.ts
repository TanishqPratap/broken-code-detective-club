
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface UsePeerConnectionProps {
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

export function usePeerConnection({
  isInitiator,
  onOfferCreated,
  onAnswerCreated,
  onIceCandidateGenerated,
  remoteOffer,
  remoteAnswer,
  remoteIceCandidate,
  localStream,
  setRemoteStream,
}: UsePeerConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerConnectionReady, setIsPeerConnectionReady] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const offerCreated = useRef(false);

  const toast = useToast().toast;

  // Initialize peer connection
  const initializePeerConnection = useCallback(async () => {
    console.log("Initializing peer connection, isInitiator:", isInitiator);
    
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };

    // Clean up existing connection
    if (peerConnectionRef.current) {
      console.log("Cleaning up existing peer connection");
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks
    if (localStream) {
      console.log("Adding local stream tracks to peer connection");
      localStream.getTracks().forEach(track => {
        console.log("Adding track:", track.kind, track.label);
        pc.addTrack(track, localStream);
      });
    } else {
      console.log("No local stream available to add tracks");
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const [stream] = event.streams;
      if (stream) {
        console.log("Setting remote stream with tracks:", stream.getTracks().map(t => t.kind));
        setRemoteStream(stream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", event.candidate.candidate);
        onIceCandidateGenerated?.(event.candidate);
      } else {
        console.log("ICE gathering complete");
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("Connection state changed to:", state);
      setConnectionState(state);
      
      if (state === 'connected') {
        setIsConnected(true);
        toast({ title: "Connected", description: "Video call is now active." });
      } else if (state === 'connecting') {
        setIsConnected(false);
      } else if (['disconnected', 'failed', 'closed'].includes(state)) {
        setIsConnected(false);
        if (state === 'failed') {
          toast({ 
            title: "Connection Failed", 
            description: "Video call connection failed. Please try again.", 
            variant: "destructive" 
          });
        }
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.log("ICE connection failed, attempting restart");
        pc.restartIce();
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log("Signaling state changed to:", pc.signalingState);
    };

    setIsPeerConnectionReady(true);
    console.log("Peer connection initialized successfully");
    return pc;
  }, [localStream, onIceCandidateGenerated, setRemoteStream, toast, isInitiator]);

  // Create offer if initiator
  const createOfferIfInitiator = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !isInitiator || offerCreated.current) {
      console.log("Skipping offer creation:", { 
        hasPc: !!pc, 
        isInitiator, 
        offerCreated: offerCreated.current,
        signalingState: pc?.signalingState 
      });
      return;
    }

    if (pc.signalingState !== "stable") {
      console.log("Cannot create offer, signaling state is:", pc.signalingState);
      return;
    }

    try {
      console.log("Creating offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      console.log("Setting local description with offer");
      await pc.setLocalDescription(offer);
      offerCreated.current = true;
      
      console.log("Offer created and set as local description");
      onOfferCreated?.(offer);
    } catch (error) {
      console.error("Failed to create offer:", error);
      toast({
        title: "Call Setup Failed",
        description: "Failed to create call offer. Please try again.",
        variant: "destructive",
      });
    }
  }, [isInitiator, onOfferCreated, toast]);

  // Handle remote offer
  const handleRemoteOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log("No peer connection available to handle remote offer");
      return;
    }

    try {
      console.log("Handling remote offer, current signaling state:", pc.signalingState);
      
      if (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") {
        console.log("Setting remote description with offer");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("Remote description set, signaling state:", pc.signalingState);
      }

      if (pc.signalingState === "have-remote-offer") {
        console.log("Creating answer...");
        const answer = await pc.createAnswer();
        
        console.log("Setting local description with answer");
        await pc.setLocalDescription(answer);
        
        console.log("Answer created and set as local description");
        onAnswerCreated?.(answer);

        // Process pending ICE candidates
        console.log("Processing", pendingIceCandidates.current.length, "pending ICE candidates");
        for (const candidate of pendingIceCandidates.current) {
          try {
            await pc.addIceCandidate(candidate);
            console.log("Added pending ICE candidate");
          } catch (err) {
            console.error("Failed to add pending ICE candidate:", err);
          }
        }
        pendingIceCandidates.current = [];
      }
    } catch (error) {
      console.error("Failed to handle remote offer:", error);
      toast({
        title: "Call Setup Failed",
        description: "Failed to process incoming call. Please try again.",
        variant: "destructive",
      });
    }
  }, [onAnswerCreated, toast]);

  // Handle remote answer
  const handleRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log("No peer connection available to handle remote answer");
      return;
    }

    try {
      console.log("Handling remote answer, current signaling state:", pc.signalingState);
      
      if (pc.signalingState === "have-local-offer") {
        console.log("Setting remote description with answer");
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Remote answer set, signaling state:", pc.signalingState);

        // Process pending ICE candidates
        console.log("Processing", pendingIceCandidates.current.length, "pending ICE candidates");
        for (const candidate of pendingIceCandidates.current) {
          try {
            await pc.addIceCandidate(candidate);
            console.log("Added pending ICE candidate");
          } catch (err) {
            console.error("Failed to add pending ICE candidate:", err);
          }
        }
        pendingIceCandidates.current = [];
      }
    } catch (error) {
      console.error("Failed to handle remote answer:", error);
      toast({
        title: "Call Setup Failed",
        description: "Failed to process call answer. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle remote ICE candidate
  const handleRemoteIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log("No peer connection, queuing ICE candidate");
      pendingIceCandidates.current.push(candidate);
      return;
    }

    try {
      console.log("Handling remote ICE candidate, signaling state:", pc.signalingState);
      
      if (pc.remoteDescription && pc.remoteDescription.type) {
        console.log("Adding ICE candidate");
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added successfully");
      } else {
        console.log("No remote description yet, queuing ICE candidate");
        pendingIceCandidates.current.push(candidate);
      }
    } catch (error) {
      console.error("Failed to add ICE candidate:", error);
      // Don't show toast for ICE candidate failures as they're common and recoverable
    }
  }, []);

  // Effect to handle remote offer
  useEffect(() => {
    if (remoteOffer && !isInitiator && isPeerConnectionReady) {
      handleRemoteOffer(remoteOffer);
    }
  }, [remoteOffer, isInitiator, isPeerConnectionReady, handleRemoteOffer]);

  // Effect to handle remote answer
  useEffect(() => {
    if (remoteAnswer && isInitiator) {
      handleRemoteAnswer(remoteAnswer);
    }
  }, [remoteAnswer, isInitiator, handleRemoteAnswer]);

  // Effect to handle remote ICE candidate
  useEffect(() => {
    if (remoteIceCandidate) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate, handleRemoteIceCandidate]);

  const cleanupPeerConnection = useCallback(() => {
    console.log("Cleaning up peer connection");
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;
      
      if (peerConnectionRef.current.signalingState !== "closed") {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = null;
    }
    
    setIsConnected(false);
    setIsPeerConnectionReady(false);
    setConnectionState("new");
    offerCreated.current = false;
    pendingIceCandidates.current = [];
    
    console.log("Peer connection cleanup complete");
  }, []);

  return {
    isConnected,
    isPeerConnectionReady,
    connectionState,
    peerConnectionRef,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupPeerConnection,
  };
}
