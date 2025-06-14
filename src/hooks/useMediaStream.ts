
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const toast = useToast().toast;

  const localStreamRef = useRef<MediaStream | null>(null);

  const requestMediaPermissions = useCallback(
    async (facingMode: "user" | "environment" = "user"): Promise<MediaStream> => {
      setIsInitializing(true);
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode,
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };
        // Stop existing
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
        setIsVideoEnabled(stream.getVideoTracks().length > 0);
        setIsAudioEnabled(stream.getAudioTracks().length > 0);
        setHasMediaPermissions(true);
        return stream;
      } catch (error) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          setLocalStream(audioOnly);
          localStreamRef.current = audioOnly;
          setIsVideoEnabled(false);
          setIsAudioEnabled(true);
          setHasMediaPermissions(true);
          toast({
            title: "Video Not Available",
            description: "Using audio-only mode. Check camera permissions.",
            variant: "destructive",
          });
          return audioOnly;
        } catch (audioError) {
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          setHasMediaPermissions(false);
          toast({
            title: "Media Access Denied",
            description: "Please allow camera and microphone access for video calls.",
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
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || !hasMediaPermissions) {
      toast({
        title: "Camera Switch Unavailable",
        description: "Cannot switch camera without permissions or active stream.",
        variant: "destructive",
      });
      return;
    }
    const newFacingMode = isFrontCamera ? "environment" : "user";
    setIsInitializing(true);
    try {
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStreamRef.current.removeTrack(currentVideoTrack);
      }
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (newVideoTrack) {
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsFrontCamera((prev) => !prev);
        setIsVideoEnabled(true);
      }
    } catch (err) {
      toast({
        title: "Camera Switch Failed",
        description: "Unable to switch camera.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isFrontCamera, hasMediaPermissions, toast]);

  const cleanupStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setHasMediaPermissions(false);
    setIsFrontCamera(true);
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
    toggleVideo,
    toggleAudio,
    switchCamera,
    cleanupStream,
  };
};

