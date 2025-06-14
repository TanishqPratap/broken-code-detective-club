
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
  const [offerProcessed, setOfferProcessed] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const lastProcessedRemoteOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const toast = useToast().toast;

  // Initializing peer connection
  const initializePeerConnection = useCallback(async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidateGenerated) {
        onIceCandidateGenerated(event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        toast({ title: "Connected", description: "Video call is now active." });
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setIsConnected(false);
        toast({ title: "Disconnected", description: "Video call connection lost.", variant: "destructive" });
      }
    };

    setIsPeerConnectionReady(true);
    return pc;
  }, [localStream, onIceCandidateGenerated, setRemoteStream, toast]);

  // Handling remote offer
  const handleRemoteOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
    }
    if (pc.signalingState !== 'have-remote-offer') return;
    const answer = await pc.createAnswer();
    if (pc.signalingState === 'have-remote-offer') {
      await pc.setLocalDescription(answer);
      onAnswerCreated?.(answer);
      lastProcessedRemoteOfferRef.current = offer;
    }
    for (const candidate of pendingIceCandidates.current) {
      await pc.addIceCandidate(candidate);
    }
    pendingIceCandidates.current = [];
  }, [onAnswerCreated]);

  // Handling remote answer
  const handleRemoteAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of pendingIceCandidates.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingIceCandidates.current = [];
      }
    },
    []
  );

  // Handling remote ICE
  const handleRemoteIceCandidate = useCallback(
    async (candidate: RTCIceCandidate) => {
      const pc = peerConnectionRef.current;
      if (!pc) {
        pendingIceCandidates.current.push(candidate);
        return;
      }
      if (
        (pc.remoteDescription && pc.remoteDescription.type) ||
        ["have-local-offer", "have-remote-offer"].includes(pc.signalingState)
      ) {
        if (pc.signalingState !== "closed") {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } else {
        pendingIceCandidates.current.push(candidate);
      }
    },
    []
  );

  // Effects (peer conn lifecycle, offers, answer, ice)
  useEffect(() => {
    if (!remoteOffer) {
      setOfferProcessed(false);
      lastProcessedRemoteOfferRef.current = null;
    }
  }, [remoteOffer]);

  useEffect(() => {
    (async () => {
      if (remoteOffer && !isInitiator && isPeerConnectionReady && !offerProcessed && peerConnectionRef.current) {
        if (
          peerConnectionRef.current.signalingState === "stable" ||
          peerConnectionRef.current.signalingState === "have-local-offer"
        ) {
          setOfferProcessed(true);
          await handleRemoteOffer(remoteOffer);
        }
      }
    })();
  }, [remoteOffer, isInitiator, isPeerConnectionReady, offerProcessed, handleRemoteOffer]);

  useEffect(() => {
    if (remoteAnswer && isInitiator && peerConnectionRef.current?.signalingState === "have-local-offer") {
      handleRemoteAnswer(remoteAnswer);
    }
  }, [remoteAnswer, isInitiator, handleRemoteAnswer]);

  useEffect(() => {
    if (remoteIceCandidate && peerConnectionRef.current) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate, handleRemoteIceCandidate]);

  useEffect(() => {
    // Peer connection ready when localStream and peerConnectionRef is set
    if (peerConnectionRef.current && localStream) {
      setIsPeerConnectionReady(true);
    } else {
      setIsPeerConnectionReady(false);
    }
  }, [localStream]);

  const cleanupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      if (peerConnectionRef.current.signalingState !== "closed") {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
    setIsPeerConnectionReady(false);
    setOfferProcessed(false);
    lastProcessedRemoteOfferRef.current = null;
    pendingIceCandidates.current = [];
  }, []);

  // Compose offer on init if initiator
  const createOfferIfInitiator = useCallback(async () => {
    if (isInitiator && peerConnectionRef.current?.signalingState === "stable") {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      onOfferCreated?.(offer);
    }
  }, [isInitiator, onOfferCreated]);

  return {
    isConnected,
    isPeerConnectionReady,
    peerConnectionRef,
    initializePeerConnection,
    createOfferIfInitiator,
    cleanupPeerConnection,
  };
}
