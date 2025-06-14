
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const toast = useToast().toast;

  const localStreamRef = useRef<MediaStream | null>(null);

  const requestMediaPermissions = useCallback(
    async (facingMode: "user" | "environment" = "user"): Promise<MediaStream> => {
      console.log("Requesting media permissions with facingMode:", facingMode);
      setIsInitializing(true);
      setPermissionError(null);
      
      try {
        // Stop existing stream first
        if (localStreamRef.current) {
          console.log("Stopping existing stream");
          localStreamRef.current.getTracks().forEach((track) => {
            console.log("Stopping track:", track.kind, track.label);
            track.stop();
          });
          localStreamRef.current = null;
          setLocalStream(null);
        }

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Media devices not supported in this browser");
        }

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode,
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1
          },
        };

        console.log("Requesting media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log("Successfully got media stream with tracks:", 
          stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled }))
        );

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsVideoEnabled(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
        setIsAudioEnabled(stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled);
        setHasMediaPermissions(true);
        setPermissionError(null);
        
        toast({
          title: "Media Access Granted",
          description: "Camera and microphone are ready for video call.",
        });
        
        return stream;
      } catch (error) {
        console.error("Failed to get media with video+audio:", error);
        
        // Try audio-only fallback
        try {
          console.log("Trying audio-only fallback");
          const audioConstraints: MediaStreamConstraints = {
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          };
          
          const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
          console.log("Got audio-only stream");
          
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsVideoEnabled(false);
          setIsAudioEnabled(true);
          setHasMediaPermissions(true);
          setPermissionError("Video not available, using audio only");
          
          toast({
            title: "Audio Only Mode",
            description: "Camera unavailable, proceeding with audio only.",
            variant: "destructive",
          });
          
          return audioStream;
        } catch (audioError) {
          console.error("Failed to get audio-only stream:", audioError);
          
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          setHasMediaPermissions(false);
          
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setPermissionError(errorMessage);
          
          toast({
            title: "Media Access Denied",
            description: "Please allow camera and microphone access in your browser settings.",
            variant: "destructive",
          });
          
          throw audioError;
        }
      } finally {
        setIsInitializing(false);
      }
    },
    [toast]
  );

  const toggleVideo = useCallback(() => {
    console.log("Toggling video, current state:", isVideoEnabled);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log("Video toggled to:", videoTrack.enabled);
      } else {
        console.log("No video track available to toggle");
      }
    }
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    console.log("Toggling audio, current state:", isAudioEnabled);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log("Audio toggled to:", audioTrack.enabled);
      } else {
        console.log("No audio track available to toggle");
      }
    }
  }, [isAudioEnabled]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || !hasMediaPermissions) {
      console.log("Cannot switch camera: no stream or permissions");
      toast({
        title: "Camera Switch Unavailable",
        description: "Cannot switch camera without permissions or active stream.",
        variant: "destructive",
      });
      return;
    }

    console.log("Switching camera from", isFrontCamera ? "front" : "back", "to", isFrontCamera ? "back" : "front");
    const newFacingMode = isFrontCamera ? "environment" : "user";
    setIsInitializing(true);
    
    try {
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        console.log("Stopping current video track");
        currentVideoTrack.stop();
        localStreamRef.current.removeTrack(currentVideoTrack);
      }

      console.log("Getting new video stream with facingMode:", newFacingMode);
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        console.log("Adding new video track");
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsFrontCamera((prev) => !prev);
        setIsVideoEnabled(true);
        console.log("Camera switched successfully");
      }
    } catch (err) {
      console.error("Camera switch failed:", err);
      toast({
        title: "Camera Switch Failed",
        description: "Unable to switch camera. Using current camera.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isFrontCamera, hasMediaPermissions, toast]);

  const cleanupStream = useCallback(() => {
    console.log("Cleaning up media stream");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("Stopping and removing track:", track.kind, track.label);
        track.stop();
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setHasMediaPermissions(false);
    setIsFrontCamera(true);
    setPermissionError(null);
    console.log("Media stream cleanup complete");
  }, []);

  return {
    localStream,
    setLocalStream,
    requestMediaPermissions,
    localStreamRef,
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
  };
};
