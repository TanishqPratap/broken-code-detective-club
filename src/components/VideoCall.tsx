import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Camera, CameraOff } from "lucide-react";
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
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerToProcess));
      console.log(`[VideoCall] Remote description set. Current signalingState after setRemoteDescription: ${peerConnection.signalingState}`);
      
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
  }, [onAnswerCreated, toast]); // Removed peerConnectionRef from deps, it's a ref

  const initializeCall = useCallback(async (currentFacingMode: 'user' | 'environment' = 'user') => {
    try {
      setIsInitializing(true);
      console.log('Initializing video call...');
      
      const stream = await requestMediaPermissions(currentFacingMode);
      setLocalStream(stream);
      setHasMediaPermissions(true);
      
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream set');
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
          if (peerConnectionRef.current.connectionState !== 'closed') { // Don't toast if manually closed by cleanup
            toast({ title: "Disconnected", description: "Video call connection lost.", variant: "destructive" });
          }
        } else if (peerConnectionRef.current.connectionState === 'connecting') {
          // Toast for connecting might be too noisy, consider removing or making it less prominent
          // toast({ title: "Connecting", description: "Establishing video call connection..." });
        }
      };
      
      // This will trigger isPeerConnectionReady to true once stream and peerConnection are set
      // setIsPeerConnectionReady will be handled by its own useEffect

      if (isInitiator) {
        console.log('Creating offer as initiator');
        const offer = await newPeerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await newPeerConnection.setLocalDescription(offer);
        onOfferCreated?.(offer);
        console.log('Offer created and sent');
      }
      // Note: Remote offer processing is now primarily handled by the useEffect below,
      // once isPeerConnectionReady is true. This simplifies initializeCall.

      for (const candidate of pendingIceCandidates.current) {
        try {
          await newPeerConnection.addIceCandidate(candidate);
          console.log('Added pending ICE candidate');
        } catch (error) {
          console.error('Error adding pending ICE candidate:', error);
        }
      }
      pendingIceCandidates.current = [];

    } catch (error) {
      console.error('Error initializing video call:', error);
      setHasMediaPermissions(false);
      toast({
        title: "Setup Error",
        description: "Failed to initialize video call. Please check permissions.",
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
  }, [initializeCall]); // initializeCall is now memoized

  useEffect(() => {
    if (peerConnectionRef.current && localStream) {
      setIsPeerConnectionReady(true);
      console.log('[VideoCall] Peer connection is ready.');
    } else {
      setIsPeerConnectionReady(false);
    }
  }, [localStream]); // Depends on peerConnectionRef.current (stable ref) and localStream


  // Process remote offer when conditions are met
  useEffect(() => {
    if (remoteOffer && !isInitiator && isPeerConnectionReady && !offerProcessed) {
      console.log('[VideoCall] Conditions met to process remote offer in useEffect:', remoteOffer);
      setOfferProcessed(true); // Mark as attempting to process this offer
      handleRemoteOffer(remoteOffer).catch(error => {
          console.error("Error from handleRemoteOffer in useEffect, offerProcessed was true, will be reset by new offer.", error);
          // If handleRemoteOffer fails, offerProcessed might be reset by new remoteOffer instance if that logic is sound.
          // Or it remains true, preventing reprocessing of this specific failed offer instance.
          // The catch in handleRemoteOffer itself sets offerProcessed to false on error.
      });
    }
  }, [remoteOffer, isInitiator, isPeerConnectionReady, offerProcessed, handleRemoteOffer]);

  useEffect(() => {
    if (remoteAnswer && peerConnectionRef.current && isInitiator) {
      handleRemoteAnswer(remoteAnswer);
    }
  }, [remoteAnswer, isInitiator]); // handleRemoteAnswer is not memoized but likely stable

  useEffect(() => {
    if (remoteIceCandidate && peerConnectionRef.current) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate]); // handleRemoteIceCandidate is not memoized but likely stable

  const requestMediaPermissions = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    // ... keep existing code (requestMediaPermissions function)
    try {
      console.log('Requesting media permissions with facing mode:', facingMode);
      
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
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        console.log("Stopped existing media tracks before requesting new permissions.");
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
  }, [toast, localStream]); // Added localStream to deps as it's used to stop tracks

  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    // ... keep existing code (handleRemoteAnswer function)
    try {
      console.log('Handling remote answer');
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      // Ensure signaling state is appropriate for setting remote answer
      if (peerConnection.signalingState !== 'have-local-offer') {
        console.warn(`[VideoCall] Cannot set remote answer in signaling state: ${peerConnection.signalingState}. Expected 'have-local-offer'.`);
        // Depending on the specific scenario, this might require a rollback or re-negotiation.
        // For now, we'll log and proceed, but this could indicate a problem.
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote answer set successfully. Signaling state:', peerConnection.signalingState);
    } catch (error) {
      console.error('Error handling remote answer:', error);
      toast({
        title: "Connection Error",
        description: "Failed to process call answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoteIceCandidate = async (candidate: RTCIceCandidate) => {
    // ... keep existing code (handleRemoteIceCandidate function)
    try {
      console.log('[VideoCall] Handling remote ICE candidate');
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.log('[VideoCall] Peer connection not ready, adding to pending candidates');
        pendingIceCandidates.current.push(candidate);
        return;
      }

      // Only add candidate if remote description is set. Some browsers might error otherwise.
      if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[VideoCall] ICE candidate added successfully');
      } else {
        console.log('[VideoCall] Remote description not set, adding ICE candidate to pending list');
        pendingIceCandidates.current.push(candidate);
      }
    } catch (error) {
      console.error('[VideoCall] Error handling remote ICE candidate:', error);
      // Avoid toast for every ICE candidate error as it can be noisy
    }
  };

  const toggleVideo = () => {
    // ... keep existing code (toggleVideo function)
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
    // ... keep existing code (toggleAudio function)
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
    // ... keep existing code (toggleCamera function)
    if (!localStream || !hasMediaPermissions) {
      toast({ title: "Camera Switch Unavailable", description: "Cannot switch camera without permissions or active stream.", variant: "destructive" });
      return;
    }
    
    try {
      setIsInitializing(true); // Show loading indicator
      const newFacingMode = isFrontCamera ? 'environment' : 'user';
      console.log(`[VideoCall] Attempting to switch camera to: ${newFacingMode}`);

      // Stop current video track
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStream.removeTrack(currentVideoTrack);
        console.log("[VideoCall] Old video track stopped and removed.");
      }

      // Get new video stream with opposite camera
      // Re-use requestMediaPermissions but it might be too broad. Simpler:
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
        localStream.addTrack(newVideoTrack); // Add to existing localStream
        
        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
            console.log("[VideoCall] Video track replaced in peer connection sender.");
          } else {
            // If no sender, perhaps addTrack is needed (though unlikely if call established)
            peerConnection.addTrack(newVideoTrack, localStream);
             console.log("[VideoCall] No existing video sender, added new track to peer connection.");
          }
        }

        if (localVideoRef.current) {
          // Create a new MediaStream for the local video ref to ensure it updates
          const displayStream = new MediaStream();
          displayStream.addTrack(newVideoTrack);
          if (isAudioEnabled && localStream.getAudioTracks()[0]) {
             displayStream.addTrack(localStream.getAudioTracks()[0]);
          }
          localVideoRef.current.srcObject = displayStream;
          console.log("[VideoCall] Local video display updated with new track.");
        }

        setIsFrontCamera(!isFrontCamera);
        setIsVideoEnabled(true); // Ensure video is marked as enabled
        console.log('Camera switched to:', newFacingMode);
      } else {
        throw new Error("Failed to get new video track from switched camera.");
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      toast({
        title: "Camera Switch Failed",
        description: "Unable to switch camera. Restoring previous camera if possible.",
        variant: "destructive",
      });
      // Attempt to re-initialize with the original camera setting
      await initializeCall(isFrontCamera ? 'user' : 'environment');
    } finally {
      setIsInitializing(false);
    }
  };

  const cleanup = () => {
    // ... keep existing code (cleanup function)
    console.log('Cleaning up video call...');
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }
    setLocalStream(null); // Ensure localStream state is cleared
    
    if (peerConnectionRef.current) {
      // Remove event listeners to prevent them from firing after close
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      // onnegotiationneeded might also need to be nulled if used

      peerConnectionRef.current.close();
      console.log('Peer connection closed');
      peerConnectionRef.current = null; // Clear the ref
    }
    
    // setLocalStream(null); // Already done above
    setRemoteStream(null);
    setIsConnected(false);
    setIsPeerConnectionReady(false);
    setOfferProcessed(false); // Reset for potential new calls
    lastProcessedRemoteOfferRef.current = null;
    pendingIceCandidates.current = []; // Clear pending candidates
    console.log('[VideoCall] Cleanup complete.');
  };

  const endCall = () => {
    // ... keep existing code (endCall function)
    console.log('[VideoCall] End call button clicked.');
    cleanup();
    onClose();
  };

  if (isInitializing && !localStream) { // Only show full screen loader if localStream isn't even ready
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
            {isInitializing && localStream && ( // Show a smaller loading indicator if initializing but stream exists
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
            {!localStream && hasMediaPermissions && ( // Show loading if permissions granted but stream not yet set
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
            )}
            {!hasMediaPermissions && ( // Show if permissions denied or not yet granted
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-2 text-center">
                   <div>
                    <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Media access required. Please check browser permissions.
                   </div>
                </div>
            )}
             {localStream && !isVideoEnabled && ( // Video specifically disabled by user
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
