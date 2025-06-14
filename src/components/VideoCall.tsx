
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCallProps {
  isInitiator: boolean;
  onClose: () => void;
  onOfferCreated?: (offer: RTCSessionDescriptionInit) => void;
  onAnswerCreated?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidateGenerated?: (candidate: RTCIceCandidate) => void;
  remoteOffer?: RTCSessionDescriptionInit;
  remoteAnswer?: RTCSessionDescriptionInit;
  remoteIceCandidate?: RTCIceCandidate;
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (remoteOffer && peerConnectionRef.current) {
      handleRemoteOffer(remoteOffer);
    }
  }, [remoteOffer]);

  useEffect(() => {
    if (remoteAnswer && peerConnectionRef.current) {
      handleRemoteAnswer(remoteAnswer);
    }
  }, [remoteAnswer]);

  useEffect(() => {
    if (remoteIceCandidate && peerConnectionRef.current) {
      handleRemoteIceCandidate(remoteIceCandidate);
    }
  }, [remoteIceCandidate]);

  const requestMediaPermissions = async () => {
    try {
      // First try with video and audio
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        setIsVideoEnabled(true);
        setIsAudioEnabled(true);
      } catch (videoError) {
        console.log('Video access failed, trying audio only:', videoError);
        // Fallback to audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          setIsVideoEnabled(false);
          setIsAudioEnabled(true);
          toast({
            title: "Video Not Available",
            description: "Using audio-only mode. Check camera permissions.",
            variant: "destructive",
          });
        } catch (audioError) {
          console.log('Audio access also failed:', audioError);
          // Create a dummy stream for signaling
          stream = new MediaStream();
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          toast({
            title: "Media Access Denied",
            description: "Video call will work in listen-only mode.",
            variant: "destructive",
          });
        }
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const initializeCall = async () => {
    try {
      setIsInitializing(true);
      
      // Request media permissions
      const stream = await requestMediaPermissions();
      setLocalStream(stream);
      setHasMediaPermissions(true);
      
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      if (stream) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
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
            description: "Video call has ended",
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
      }

    } catch (error) {
      console.error('Error initializing video call:', error);
      setHasMediaPermissions(false);
      toast({
        title: "Setup Error",
        description: "Failed to initialize video call. Please check your permissions and try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRemoteOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('Handling remote offer:', offer);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      onAnswerCreated?.(answer);
      console.log('Created and sent answer');
    } catch (error) {
      console.error('Error handling remote offer:', error);
      toast({
        title: "Connection Error",
        description: "Failed to process incoming call",
        variant: "destructive",
      });
    }
  };

  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('Handling remote answer:', answer);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(answer);
      console.log('Set remote answer successfully');
    } catch (error) {
      console.error('Error handling remote answer:', error);
    }
  };

  const handleRemoteIceCandidate = async (candidate: RTCIceCandidate) => {
    try {
      console.log('Handling remote ICE candidate:', candidate);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.addIceCandidate(candidate);
      console.log('Added ICE candidate successfully');
    } catch (error) {
      console.error('Error handling remote ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
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
          <p>Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
            {!hasMediaPermissions && (
              <span className="text-xs text-red-600">
                Media access limited
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-4">
          {/* Remote video */}
          <div className="flex-1 bg-gray-900 rounded-lg relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              Remote
            </div>
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-pulse mb-2">Waiting for connection...</div>
                  <div className="text-sm opacity-70">
                    {isInitiator ? 'Calling...' : 'Incoming call'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Local video */}
          <div className="w-64 bg-gray-900 rounded-lg relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              You
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="sm"
            onClick={toggleVideo}
            disabled={!hasMediaPermissions}
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="sm"
            onClick={toggleAudio}
            disabled={!hasMediaPermissions}
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
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
