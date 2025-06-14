import { useEffect, useRef, useState } from "react";
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
  const [offerProcessed, setOfferProcessed] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  // NEW: add effect to reset offerProcessed when remoteOffer changes (for new incoming call)
  useEffect(() => {
    if (!isInitiator && remoteOffer) {
      setOfferProcessed(false);
    }
  }, [remoteOffer, isInitiator]);

  // MODIFIED: useEffect for handling remote offer
  useEffect(() => {
    if (
      remoteOffer && 
      peerConnectionRef.current && 
      !isInitiator && 
      !offerProcessed
    ) {
      console.log('[VideoCall] Processing remote offer:', remoteOffer);
      handleRemoteOffer(remoteOffer);
      setOfferProcessed(true);
    }
  }, [remoteOffer, isInitiator, offerProcessed]);

  useEffect(() => {
    if (remoteAnswer && peerConnectionRef.current && isInitiator) {
      handleRemoteAnswer(remoteAnswer);
    }
  }, [remoteAnswer, isInitiator]);

  useEffect(() => {
    if (remoteIceCandidate && peerConnectionRef.current) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate]);

  const requestMediaPermissions = async (facingMode: 'user' | 'environment' = 'user') => {
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
        
        throw audioError;
      }
    }
  };

  const initializeCall = async () => {
    try {
      setIsInitializing(true);
      console.log('Initializing video call...');
      
      // Request media permissions
      const stream = await requestMediaPermissions();
      setLocalStream(stream);
      setHasMediaPermissions(true);
      
      // Set local video
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream set');
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      console.log('Peer connection created');

      // Add local stream to peer connection
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind);
          peerConnection.addTrack(track, stream);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('Remote video stream set');
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && onIceCandidateGenerated) {
          console.log('Generated ICE candidate:', event.candidate);
          onIceCandidateGenerated(event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
          toast({
            title: "Connected",
            description: "Video call is now active",
          });
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setIsConnected(false);
          toast({
            title: "Disconnected",
            description: "Video call connection lost",
            variant: "destructive",
          });
        } else if (peerConnection.connectionState === 'connecting') {
          toast({
            title: "Connecting",
            description: "Establishing video call connection...",
          });
        }
      };

      // If initiator, create offer
      if (isInitiator) {
        console.log('Creating offer as initiator');
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnection.setLocalDescription(offer);
        onOfferCreated?.(offer);
        console.log('Offer created and sent');
      } else if (remoteOffer && !offerProcessed) {
        // If we're not the initiator and we have a remote offer, process it
        console.log('Processing existing remote offer on initialization');
        await handleRemoteOffer(remoteOffer);
        setOfferProcessed(true);
      }

      // Process any pending ICE candidates
      for (const candidate of pendingIceCandidates.current) {
        try {
          await peerConnection.addIceCandidate(candidate);
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
        description: "Failed to initialize video call. Please check your permissions.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRemoteOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('[VideoCall] Handling remote offer');
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.log('[VideoCall] No peer connection available, offer will be processed after initialization');
        return;
      }

      await peerConnection.setRemoteDescription(offer);
      console.log('[VideoCall] Remote description set, creating answer...');
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      onAnswerCreated?.(answer);
      console.log('[VideoCall] Answer created and sent');

      // Apply any ICE candidates that came before remoteDescription was set
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
      toast({
        title: "Connection Error",
        description: "Failed to process incoming call",
        variant: "destructive",
      });
    }
  };

  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('Handling remote answer');
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(answer);
      console.log('Remote answer set successfully');
    } catch (error) {
      console.error('Error handling remote answer:', error);
    }
  };

  const handleRemoteIceCandidate = async (candidate: RTCIceCandidate) => {
    try {
      console.log('[VideoCall] Handling remote ICE candidate');
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.log('[VideoCall] Peer connection not ready, adding to pending candidates');
        pendingIceCandidates.current.push(candidate);
        return;
      }

      if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        await peerConnection.addIceCandidate(candidate);
        console.log('[VideoCall] ICE candidate added successfully');
      } else {
        console.log('[VideoCall] Remote description not set, adding ICE candidate to pending list');
        pendingIceCandidates.current.push(candidate);
      }
    } catch (error) {
      console.error('[VideoCall] Error handling remote ICE candidate:', error);
    }
  };

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
    if (!localStream) return;
    
    try {
      // Stop current video track
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStream.removeTrack(currentVideoTrack);
      }

      // Get new video stream with opposite camera
      const newFacingMode = isFrontCamera ? 'environment' : 'user';
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        }
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        // Add new track to local stream
        localStream.addTrack(newVideoTrack);
        
        // Replace track in peer connection
        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }

        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        setIsFrontCamera(!isFrontCamera);
        console.log('Camera switched to:', newFacingMode);
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      toast({
        title: "Camera Switch Failed",
        description: "Unable to switch camera. Using current camera.",
        variant: "destructive",
      });
    }
  };

  const cleanup = () => {
    console.log('Cleaning up video call...');
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log('Peer connection closed');
    }
    
    setLocalStream(null);
    setRemoteStream(null);
  };

  const endCall = () => {
    cleanup();
    onClose();
  };

  if (isInitializing) {
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
            <span className={`text-sm px-2 py-1 rounded ${
              isConnected ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
            }`}>
              {isConnected ? 'Connected' : 'Connecting...'}
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
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-lg mb-2">
                    {isInitiator ? 'Calling...' : 'Connecting...'}
                  </div>
                  <div className="text-sm opacity-70">
                    {isInitiator ? 'Waiting for answer...' : 'Establishing connection...'}
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
            {!isVideoEnabled && (
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
            disabled={!hasMediaPermissions}
            className="flex items-center gap-2"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            Video
          </Button>
          
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="sm"
            onClick={toggleAudio}
            disabled={!hasMediaPermissions}
            className="flex items-center gap-2"
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            Audio
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            disabled={!hasMediaPermissions || !isVideoEnabled}
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
