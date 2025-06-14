
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStreamVideo } from '@/components/StreamVideoProvider';

interface UseStreamVideoCallProps {
  sessionInfo: { creator_id: string; subscriber_id: string } | null;
  currentUserId: string;
  onCallMessage: (content: string) => Promise<void>;
}

export const useStreamVideoCall = ({
  sessionInfo,
  currentUserId,
  onCallMessage,
}: UseStreamVideoCallProps) => {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showCallPickup, setShowCallPickup] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string>("");
  const [callId, setCallId] = useState<string>("");
  const [isInitiator, setIsInitiator] = useState(false);
  const { client } = useStreamVideo();
  const { toast } = useToast();

  const generateCallId = useCallback(() => {
    if (!sessionInfo) return "";
    // Create a consistent call ID based on session participants
    const sortedIds = [sessionInfo.creator_id, sessionInfo.subscriber_id].sort();
    return `call_${sortedIds.join('_')}_${Date.now()}`;
  }, [sessionInfo]);

  const startVideoCall = useCallback(async () => {
    if (!client || !sessionInfo) return;

    try {
      const newCallId = generateCallId();
      setCallId(newCallId);
      setIsInitiator(true);
      setShowVideoCall(true);

      // Send call invitation message
      await onCallMessage(`STREAM_VIDEO_CALL_INVITE:${newCallId}`);
      await onCallMessage("📹 Started a video call");

      toast({
        title: "Video Call",
        description: "Call invitation sent",
      });
    } catch (error) {
      console.error("Failed to start video call:", error);
      toast({
        title: "Call Error",
        description: "Failed to start video call",
        variant: "destructive",
      });
    }
  }, [client, sessionInfo, generateCallId, onCallMessage, toast]);

  const handleIncomingCall = useCallback((callId: string, callerName: string) => {
    setCallId(callId);
    setIncomingCallFrom(callerName);
    setShowCallPickup(true);
    setIsInitiator(false);

    toast({
      title: "Incoming Video Call",
      description: `${callerName} is calling you`,
    });
  }, [toast]);

  const acceptCall = useCallback(async () => {
    setShowCallPickup(false);
    setShowVideoCall(true);

    try {
      await onCallMessage("STREAM_VIDEO_CALL_ACCEPTED");
      await onCallMessage("📹 Joined the video call");
    } catch (error) {
      console.error("Failed to accept call:", error);
    }
  }, [onCallMessage]);

  const declineCall = useCallback(async () => {
    setShowCallPickup(false);
    setCallId("");

    try {
      await onCallMessage("STREAM_VIDEO_CALL_DECLINED");
      await onCallMessage("📹 Video call declined");
    } catch (error) {
      console.error("Failed to decline call:", error);
    }
  }, [onCallMessage]);

  const endCall = useCallback(async () => {
    setShowVideoCall(false);
    setShowCallPickup(false);
    setCallId("");

    try {
      await onCallMessage("STREAM_VIDEO_CALL_END");
      await onCallMessage("📹 Video call ended");
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  }, [onCallMessage]);

  const processSignalingMessage = useCallback((content: string, senderId: string) => {
    if (!sessionInfo || senderId === currentUserId) return;

    // Validate sender
    const isValidSender = senderId === sessionInfo.creator_id || senderId === sessionInfo.subscriber_id;
    if (!isValidSender) return;

    const callerName = senderId === sessionInfo.creator_id ? "Creator" : "Subscriber";

    if (content.startsWith("STREAM_VIDEO_CALL_INVITE:")) {
      const callId = content.replace("STREAM_VIDEO_CALL_INVITE:", "");
      handleIncomingCall(callId, callerName);
    } else if (content === "STREAM_VIDEO_CALL_ACCEPTED") {
      toast({
        title: "Call Accepted",
        description: "The other participant accepted your call",
      });
    } else if (content === "STREAM_VIDEO_CALL_DECLINED") {
      setShowVideoCall(false);
      setCallId("");
      toast({
        title: "Call Declined",
        description: "The other participant declined the video call",
        variant: "destructive",
      });
    } else if (content === "STREAM_VIDEO_CALL_END") {
      setShowVideoCall(false);
      setCallId("");
      toast({
        title: "Call Ended",
        description: "The other participant ended the video call",
      });
    }
  }, [sessionInfo, currentUserId, handleIncomingCall, toast]);

  return {
    showVideoCall,
    showCallPickup,
    incomingCallFrom,
    callId,
    isInitiator,
    startVideoCall,
    acceptCall,
    declineCall,
    endCall,
    processSignalingMessage,
  };
};
