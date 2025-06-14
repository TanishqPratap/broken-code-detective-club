
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface SessionInfo {
  creator_id: string;
  subscriber_id: string;
}

type VideoCallState = {
  showVideoCall: boolean;
  setShowVideoCall: (b: boolean) => void;
  setIncomingCallFrom: (who: string) => void;
  setShowCallPickup: (b: boolean) => void;
  setVideoCallOffer: (o: RTCSessionDescriptionInit | null) => void;
  setVideoCallAnswer: (a: RTCSessionDescriptionInit | null) => void;
  setVideoCallIceCandidate: (c: RTCIceCandidate | null) => void;
  setIsVideoCallInitiator: (b: boolean) => void;
  resetVideoCallState: () => void;
};

export function useVideoCallSignaling(
  currentUserId: string,
  sessionInfo: SessionInfo | null,
  videoCallState: VideoCallState
) {
  const { toast } = useToast();

  return useCallback(
    (content: string, senderId: string) => {
      // Only process signaling messages from other users
      if (senderId === currentUserId) {
        console.log("Ignoring signaling message from self");
        return;
      }

      console.log("Processing video call signaling message:", content.substring(0, 50));

      try {
        if (content.startsWith("VIDEO_CALL_OFFER:")) {
          console.log("Received video call offer");
          const offerData = JSON.parse(content.replace("VIDEO_CALL_OFFER:", ""));
          
          // Clear previous state and set new offer
          videoCallState.setVideoCallAnswer(null);
          videoCallState.setVideoCallIceCandidate(null);
          videoCallState.setVideoCallOffer(offerData);
          
          const callerName = senderId === sessionInfo?.creator_id ? "Creator" : "Subscriber";
          videoCallState.setIncomingCallFrom(callerName);
          videoCallState.setShowCallPickup(true);
          
          console.log("Showing call pickup modal for offer from:", callerName);
          
        } else if (content.startsWith("VIDEO_CALL_ANSWER:")) {
          console.log("Received video call answer");
          const answerData = JSON.parse(content.replace("VIDEO_CALL_ANSWER:", ""));
          videoCallState.setVideoCallAnswer(answerData);
          
        } else if (content.startsWith("VIDEO_CALL_ICE:")) {
          console.log("Received ICE candidate");
          const iceData = JSON.parse(content.replace("VIDEO_CALL_ICE:", ""));
          videoCallState.setVideoCallIceCandidate(iceData);
          
        } else if (content === "VIDEO_CALL_END") {
          console.log("Received video call end signal");
          videoCallState.setShowVideoCall(false);
          videoCallState.setShowCallPickup(false);
          videoCallState.resetVideoCallState();
          
          toast({
            title: "Call Ended",
            description: "The other participant ended the video call",
          });
          
        } else if (content === "VIDEO_CALL_DECLINED") {
          console.log("Received video call declined signal");
          videoCallState.setShowVideoCall(false);
          videoCallState.setShowCallPickup(false);
          videoCallState.resetVideoCallState();
          
          toast({
            title: "Call Declined",
            description: "The other participant declined the video call",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing video call signaling message:", error);
        toast({
          title: "Call Error",
          description: "Failed to process video call signal",
          variant: "destructive",
        });
      }
    },
    [currentUserId, sessionInfo, videoCallState, toast]
  );
}
