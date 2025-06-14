import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  remoteIceCandidate
}: VideoCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const { toast } = useToast();

  const [isPeerConnectionReady, setIsPeerConnectionReady] = useState(false);
  const [offerProcessed, setOfferProcessed] = useState(false);
  const lastProcessedRemoteOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Create a ref for localStream to be used in requestMediaPermissions
  // This avoids dependency cycle with initializeCall
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Effect to reset offerProcessed when a new remoteOffer instance arrives
  useEffect(() => {
    if (!isInitiator && remoteOffer) {
      if (remoteOffer !== lastProcessedRemoteOfferRef.current) {
        console.log('[VideoCall] New remoteOffer instance detected, resetting offerProcessed.', remoteOffer);
        setOfferProcessed(false);
        // lastProcessedRemoteOfferRef will be updated when the offer is actually processed
      }
    } else if (!remoteOffer) {
      // If remoteOffer becomes null (e.g., call ended from other side, state reset), clear flags
      setOfferProcessed(false);
      lastProcessedRemoteOfferRef.current = null;
    }
  }, [remoteOffer, isInitiator]);

  const requestMediaPermissions = useCallback(async (facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> => {
    try {
      console.log('[VideoCall] Requesting media permissions with facing mode:', facingMode);
      
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: facingMode
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      // Stop existing tracks before requesting new ones to avoid conflicts
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        console.log("[VideoCall] Stopped existing media tracks before requesting new permissions.");
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream obtained:', stream);
      
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log('Video tracks:', videoTracks.length, 'Audio tracks:', audioTracks.length);
      
      setIsVideoEnabled(videoTracks.length > 0);
      setIsAudioEnabled(audioTracks.length > 0);
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      try {
        console.log('Trying audio only...');
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setIsVideoEnabled(false);
        setIsAudioEnabled(true);
        
        toast({
          title: "Video Not Available",
          description: "Using audio-only mode. Check camera permissions.",
          variant: "destructive",
        });
        
        return audioOnlyStream;
      } catch (audioError) {
        console.error('Audio access also failed:', audioError);
        setIsVideoEnabled(false);
        setIsAudioEnabled(false);
        
        toast({
          title: "Media Access Denied",
          description: "Please allow camera and microphone access for video calls.",
          variant: "destructive",
        });
        
        throw audioError; // Rethrow to be caught by initializeCall
      }
    }
  }, [toast]);

  const handleRemoteOffer = useCallback(async (offerToProcess: RTCSessionDescriptionInit) => {
    try {
      console.log('[VideoCall] Handling remote offer:', offerToProcess);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.error('[VideoCall] No peer connection available in handleRemoteOffer.');
        toast({ title: "Connection Error", description: "Peer connection not ready.", variant: "destructive" });
        return;
      }
      console.log(`[VideoCall] Current signalingState before setRemoteDescription: ${peerConnection.signalingState}`);

      // Defensive check: if current remote description is already this offer, maybe skip?
      // For simplicity, WebRTC's setRemoteDescription should handle redundant calls if offer is identical.
      // Only set if signaling state is stable or have-local-offer (for rollback scenarios)
      if (peerConnection.signalingState === 'stable' || peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerToProcess));
        console.log(`[VideoCall] Remote description set. Current signalingState after setRemoteDescription: ${peerConnection.signalingState}`);
      } else {
         console.warn(`[VideoCall] Skipping setRemoteDescription for offer in state: ${peerConnection.signalingState}`);
      }
      
      if (peerConnection.signalingState !== 'have-remote-offer') {
        console.error(`[VideoCall] CRITICAL: Invalid signaling state ${peerConnection.signalingState} after setRemoteDescription(offer). Expected 'have-remote-offer'. Offer:`, offerToProcess);
         // This condition is often hit if setRemoteDescription was skipped or failed.
         // It's safer not to proceed with createAnswer if the state isn't right.
        return;
      }
      
      const answer = await peerConnection.createAnswer();
      console.log(`[VideoCall] Answer created. Current signalingState after createAnswer: ${peerConnection.signalingState}`);

      if (peerConnection.signalingState !== 'have-remote-offer') {
        console.error(`[VideoCall] CRITICAL: Invalid signaling state ${peerConnection.signalingState} before setLocalDescription(answer). Expected 'have-remote-offer'. Offer:`, offerToProcess, "Answer:", answer);
        toast({
          title: "Connection Error",
          description: `Signaling state error: ${peerConnection.signalingState}. Please try again.`,
          variant: "destructive",
        });
        return; 
      }

      await peerConnection.setLocalDescription(answer);
      console.log(`[VideoCall] Local description (answer) set. Current signalingState: ${peerConnection.signalingState}`);
      
      onAnswerCreated?.(answer);
      lastProcessedRemoteOfferRef.current = offerToProcess; // Mark this offer instance as processed

      for (const candidate of pendingIceCandidates.current) {
        try {
          await peerConnection.addIceCandidate(candidate);
          console.log('[VideoCall] Added pending ICE candidate after answer');
        } catch (error) {
          console.error('[VideoCall] Error adding pending ICE candidate:', error);
        }
      }
      pendingIceCandidates.current = [];
    } catch (error) {
      console.error('[VideoCall] Error handling remote offer:', error);
      setOfferProcessed(false); // Allow reprocessing if an error occurred with this attempt
      toast({
        title: "Connection Error",
        description: "Failed to process incoming call. Please try again.",
        variant: "destructive",
      });
    }
  }, [onAnswerCreated, toast]);

  const initializeCall = useCallback(async (currentFacingMode: 'user' | 'environment' = 'user') => {
    try {
      setIsInitializing(true);
      console.log('[VideoCall] Initializing video call...');
      
      const stream = await requestMediaPermissions(currentFacingMode);
      setLocalStream(stream);
      setHasMediaPermissions(true);
      
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
        console.log('[VideoCall] Local video stream set');
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      // Ensure any existing peer connection is closed before creating a new one
      if (peerConnectionRef.current) {
        console.log('[VideoCall] Closing existing peer connection before re-initialization.');
        peerConnectionRef.current.close();
      }
      const newPeerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = newPeerConnection;
      console.log('Peer connection created/re-created');

      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind);
          newPeerConnection.addTrack(track, stream);
        });
      }

      newPeerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const [remoteS] = event.streams;
        setRemoteStream(remoteS);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteS;
          console.log('Remote video stream set');
        }
      };

      newPeerConnection.onicecandidate = (event) => {
        if (event.candidate && onIceCandidateGenerated) {
          console.log('Generated ICE candidate:', event.candidate);
          onIceCandidateGenerated(event.candidate);
        }
      };

      newPeerConnection.onconnectionstatechange = () => {
        if (!peerConnectionRef.current) return;
        console.log('Connection state:', peerConnectionRef.current.connectionState);
        
        if (peerConnectionRef.current.connectionState === 'connected') {
          setIsConnected(true);
          toast({ title: "Connected", description: "Video call is now active." });
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnectionRef.current.connectionState)) {
          setIsConnected(false);
          if (peerConnectionRef.current.connectionState !== 'closed' && peerConnectionRef.current.connectionState !== 'failed') { 
            toast({ title: "Disconnected", description: "Video call connection lost.", variant: "destructive" });
          } else if (peerConnectionRef.current.connectionState === 'failed') {
             toast({ title: "Connection Failed", description: "Video call failed to connect.", variant: "destructive" });
          }
        }
      };
      
      newPeerConnection.onnegotiationneeded = async () => {
        console.log('[VideoCall] Negotiation needed. Initiator:', isInitiator);
        // This is typically for the initiator if conditions change (e.g., track added/removed after initial offer)
        // For simplicity, we primarily rely on initial offer/answer. Advanced scenarios might re-trigger offer creation here for initiator.
        if (isInitiator && peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
          try {
            console.log('[VideoCall] Re-creating offer due to negotiationneeded.');
            const offer = await peerConnectionRef.current.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await peerConnectionRef.current.setLocalDescription(offer);
            onOfferCreated?.(offer);
            console.log('[VideoCall] Re-offer created and sent via onnegotiationneeded.');
          } catch (error) {
            console.error('[VideoCall] Error during onnegotiationneeded offer creation:', error);
          }
        }
      };

      if (isInitiator) {
        console.log('Creating offer as initiator');
        // Defer offer creation slightly if peer connection is brand new
        // to allow track additions to settle.
        // This is more of a precaution; often not strictly necessary.
        // await new Promise(resolve => setTimeout(resolve, 100)); 
        
        if (newPeerConnection.signalingState === 'stable') { // Only create offer if stable
            const offer = await newPeerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await newPeerConnection.setLocalDescription(offer);
            onOfferCreated?.(offer);
            console.log('Offer created and sent');
        } else {
            console.warn(`[VideoCall] Skipping offer creation as initiator because signalingState is ${newPeerConnection.signalingState}`);
        }
      }
      
      // Process any pending ICE candidates that arrived before PC was fully ready
      // This check for remoteDescription helps ensure we don't add candidates too early.
      if (newPeerConnection.remoteDescription) {
        for (const candidate of pendingIceCandidates.current) {
          try {
            await newPeerConnection.addIceCandidate(candidate);
            console.log('[VideoCall] Added pending ICE candidate during init');
          } catch (error) {
            console.error('[VideoCall] Error adding pending ICE candidate during init:', error);
          }
        }
        pendingIceCandidates.current = [];
      }

    } catch (error) {
      console.error('Error initializing video call:', error);
      setHasMediaPermissions(false);
      toast({
        title: "Setup Error",
        description: `Failed to initialize video call. ${error instanceof Error ? error.message : "Please check permissions."}`,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isInitiator, onIceCandidateGenerated, onOfferCreated, toast, requestMediaPermissions]);

  useEffect(() => {
    initializeCall(isFrontCamera ? 'user' : 'environment');
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrontCamera]);

  useEffect(() => {
    if (peerConnectionRef.current && localStream) {
      setIsPeerConnectionReady(true);
      console.log('[VideoCall] Peer connection is ready.');
    } else {
      setIsPeerConnectionReady(false);
    }
  }, [localStream]);

  // Process remote offer when conditions are met
  useEffect(() => {
    if (remoteOffer && !isInitiator && isPeerConnectionReady && !offerProcessed && peerConnectionRef.current) {
      console.log('[VideoCall] Conditions met to process remote offer in useEffect:', remoteOffer);
      // Ensure peer connection is in a state to receive an offer
      if (peerConnectionRef.current.signalingState === 'stable' || peerConnectionRef.current.signalingState === 'have-local-offer') {
        setOfferProcessed(true); 
        handleRemoteOffer(remoteOffer).catch(error => {
            console.error("[VideoCall] Error from handleRemoteOffer in useEffect, offerProcessed was true, will be reset by new offer or error handling.", error);
        });
      } else {
        console.warn(`[VideoCall] Remote offer received but peer connection not in 'stable' or 'have-local-offer' state. Current state: ${peerConnectionRef.current.signalingState}. Deferring offer processing.`);
        // Consider setting a flag to retry or queue the offer if this state persists
      }
    }
  }, [remoteOffer, isInitiator, isPeerConnectionReady, offerProcessed, handleRemoteOffer]);

  useEffect(() => {
    if (remoteAnswer && peerConnectionRef.current && isInitiator) {
      if (peerConnectionRef.current.signalingState === 'have-local-offer') {
        handleRemoteAnswer(remoteAnswer);
      } else {
         console.warn(`[VideoCall] Remote answer received but peer connection not in 'have-local-offer' state. Current state: ${peerConnectionRef.current.signalingState}. Ignoring answer.`);
      }
    }
  }, [remoteAnswer, isInitiator, handleRemoteAnswer]);

  useEffect(() => {
    if (remoteIceCandidate && peerConnectionRef.current) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate, handleRemoteIceCandidate]);

  const handleRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('Handling remote answer:', answer);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.error("[VideoCall] No peer connection for remote answer.");
        return;
      }

      if (peerConnection.signalingState !== 'have-local-offer') {
        console.warn(`[VideoCall] Cannot set remote answer in signaling state: ${peerConnection.signalingState}. Expected 'have-local-offer'. This may indicate a race condition or dropped offer.`);
        // Attempt to set anyway, but log this clearly.
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote answer set successfully. Signaling state:', peerConnection.signalingState);

      // After setting remote answer, process any queued ICE candidates
      for (const candidate of pendingIceCandidates.current) {
        try {
            if (peerConnection.remoteDescription) { // Double check remote description still exists
                await peerConnection.addIceCandidate(candidate);
                console.log('[VideoCall] Added pending ICE candidate after remote answer set');
            }
        } catch (error) {
            console.error('[VideoCall] Error adding pending ICE candidate after remote answer:', error);
        }
      }
      pendingIceCandidates.current = [];

    } catch (error) {
      console.error('Error handling remote answer:', error);
      toast({
        title: "Connection Error",
        description: "Failed to process call answer. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRemoteIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    try {
      console.log('[VideoCall] Handling remote ICE candidate:', candidate);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.log('[VideoCall] Peer connection not ready, adding to pending candidates (from handleRemoteIceCandidate)');
        pendingIceCandidates.current.push(candidate);
        return;
      }

      // Only add candidate if remote description is set and signaling state isn't closed.
      // Adding candidates before setRemoteDescription (especially for the receiver) can cause issues.
      // Or if the connection is in a state where it can accept candidates ('have-local-offer' for initiator, 'have-remote-offer' for receiver)
      if ( (peerConnection.remoteDescription && peerConnection.remoteDescription.type) || 
           (peerConnection.signalingState === 'have-local-offer' || peerConnection.signalingState === 'have-remote-offer')
         ) {
        if (peerConnection.signalingState !== 'closed') {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[VideoCall] ICE candidate added successfully.');
        } else {
          console.log('[VideoCall] ICE candidate received but connection is closed.');
        }
      } else {
        console.log(`[VideoCall] Remote description not yet set or signaling state (${peerConnection.signalingState}) not ready, adding ICE candidate to pending list.`);
        pendingIceCandidates.current.push(candidate);
      }
    } catch (error) {
      // Don't toast for every ICE candidate error, can be noisy. Log it.
      console.error('[VideoCall] Error handling remote ICE candidate:', error, 'Candidate:', candidate);
    }
  }, []);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('Video toggled:', videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('Audio toggled:', audioTrack.enabled);
      }
    }
  };

  const toggleCamera = async () => {
    if (!localStreamRef.current || !hasMediaPermissions) {
      toast({ title: "Camera Switch Unavailable", description: "Cannot switch camera without permissions or active stream.", variant: "destructive" });
      return;
    }
    
    try {
      setIsInitializing(true); // Show loading indicator
      const newFacingMode = isFrontCamera ? 'environment' : 'user';
      console.log(`[VideoCall] Attempting to switch camera to: ${newFacingMode}`);

      // Stop current video track from the stream in the ref
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStreamRef.current.removeTrack(currentVideoTrack);
        console.log("[VideoCall] Old video track stopped and removed from ref stream.");
      }

      // Get new video stream with opposite camera
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        }
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        console.log("[VideoCall] New video track obtained:", newVideoTrack);
        localStreamRef.current.addTrack(newVideoTrack); // Add to existing localStream in ref
        
        // Update the stateful localStream as well for UI consistency if needed, or rely on ref for PC
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));


        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
            console.log("[VideoCall] Video track replaced in peer connection sender.");
          } else {
            peerConnection.addTrack(newVideoTrack, localStreamRef.current); // use ref stream
             console.log("[VideoCall] No existing video sender, added new track to peer connection.");
          }
        }

        if (localVideoRef.current) {
          // Create a new MediaStream for the local video ref to ensure it updates
          // with the new track from the ref stream.
          const displayStream = new MediaStream();
          displayStream.addTrack(newVideoTrack); // Add the new video track
          if (isAudioEnabled && localStreamRef.current.getAudioTracks()[0]) {
             displayStream.addTrack(localStreamRef.current.getAudioTracks()[0]); // Add existing audio track
          }
          localVideoRef.current.srcObject = displayStream;
          console.log("[VideoCall] Local video display updated with new track.");
        }

        setIsFrontCamera(!isFrontCamera);
        setIsVideoEnabled(true); 
        console.log('[VideoCall] Camera switched to:', newFacingMode);
      } else {
        throw new Error("Failed to get new video track from switched camera.");
      }
    } catch (error) {
      console.error('[VideoCall] Error switching camera:', error);
      toast({
        title: "Camera Switch Failed",
        description: "Unable to switch camera. Restoring previous camera if possible.",
        variant: "destructive",
      });
      // Attempt to re-initialize with the original camera setting by triggering initializeCall via useEffect
      // This might involve temporarily changing isFrontCamera and then changing it back if initializeCall depends on it
      // Or, more directly:
      await initializeCall(isFrontCamera ? 'user' : 'environment'); // Re-init with current (failed) attempt's original mode
    } finally {
      setIsInitializing(false);
    }
  };

  const cleanup = () => {
    console.log('Cleaning up video call...');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[VideoCall] Stopped track:', track.kind);
      });
    }
    setLocalStream(null); // Clear state
    localStreamRef.current = null; // Clear ref
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onnegotiationneeded = null;

      if (peerConnectionRef.current.signalingState !== 'closed') {
        peerConnectionRef.current.close();
        console.log('[VideoCall] Peer connection closed');
      }
      peerConnectionRef.current = null; 
    }
    
    setRemoteStream(null);
    setIsConnected(false);
    setIsPeerConnectionReady(false);
    setOfferProcessed(false); 
    lastProcessedRemoteOfferRef.current = null;
    pendingIceCandidates.current = []; 
    console.log('[VideoCall] Cleanup complete.');
  };

  const endCall = () => {
    console.log('[VideoCall] End call button clicked.');
    cleanup();
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
            <span className={`text-sm px-2 py-1 rounded ${
              isConnected ? 'text-green-600 bg-green-100' : isPeerConnectionReady ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
            }`}>
              {isConnected ? 'Connected' : isPeerConnectionReady ? (peerConnectionRef.current?.connectionState || 'Connecting...') : 'Initializing Media...'}
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
          <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              Remote
            </div>
            {!remoteStream && peerConnectionRef.current?.connectionState !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-lg mb-2">
                    {peerConnectionRef.current?.connectionState === 'connecting' || peerConnectionRef.current?.connectionState === 'new' ? 'Connecting...' : 'Waiting for remote video...'}
                  </div>
                  <div className="text-sm opacity-70">
                    {isInitiator ? 'Calling...' : 'Establishing connection...'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Local video */}
          <div className="w-80 bg-gray-900 rounded-lg relative overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              You {isFrontCamera ? '(Front)' : '(Back)'}
            </div>
            {!localStream && hasMediaPermissions && ( 
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
            )}
            {!hasMediaPermissions && ( 
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-2 text-center">
                   <div>
                    <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Media access required. Please check browser permissions.
                   </div>
                </div>
            )}
             {localStream && !isVideoEnabled && ( 
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mt-4">
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="sm"
            onClick={toggleVideo}
            disabled={!hasMediaPermissions || !localStream}
            className="flex items-center gap-2"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            Video
          </Button>
          
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="sm"
            onClick={toggleAudio}
            disabled={!hasMediaPermissions || !localStream}
            className="flex items-center gap-2"
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            Audio
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            disabled={!hasMediaPermissions || !localStream || !isVideoEnabled || isInitializing}
            className="flex items-center gap-2"
          >
            {isFrontCamera ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            Switch Camera
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
            className="flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
