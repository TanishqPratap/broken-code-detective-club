
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
      console.log("=== Video Call Signaling Debug ===");
      console.log("Message content:", content);
      console.log("Sender ID:", senderId);
      console.log("Current User ID:", currentUserId);
      console.log("Session Info:", sessionInfo);

      // Only process signaling messages from other users
      if (senderId === currentUserId) {
        console.log("Ignoring signaling message from self");
        return;
      }

      console.log("Processing signaling message from:", senderId);

      try {
        if (content.startsWith("VIDEO_CALL_OFFER:")) {
          console.log("=== PROCESSING VIDEO CALL OFFER ===");
          console.log("Full offer content:", content);
          
          const offerData = JSON.parse(content.replace("VIDEO_CALL_OFFER:", ""));
          console.log("Parsed offer data:", offerData);
          
          // Clear previous state
          videoCallState.resetVideoCallState();
          
          // Set the new offer
          videoCallState.setVideoCallOffer(offerData);
          
          // Determine caller name based on session info
          let callerName = "Unknown User";
          if (sessionInfo) {
            if (senderId === sessionInfo.creator_id) {
              callerName = "Creator";
            } else if (senderId === sessionInfo.subscriber_id) {
              callerName = "Subscriber";
            }
          }
          
          console.log("=== SHOWING PICKUP MODAL ===");
          console.log("Caller name:", callerName);
          console.log("Setting incoming call from:", callerName);
          
          // Set incoming call state
          videoCallState.setIncomingCallFrom(callerName);
          videoCallState.setShowCallPickup(true);
          videoCallState.setIsVideoCallInitiator(false);
          
          console.log("Pickup modal state set, showing toast");
          
          toast({
            title: "Incoming Video Call",
            description: `${callerName} is calling you`,
          });
          
        } else if (content.startsWith("VIDEO_CALL_ANSWER:")) {
          console.log("Received video call answer from:", senderId);
          const answerData = JSON.parse(content.replace("VIDEO_CALL_ANSWER:", ""));
          videoCallState.setVideoCallAnswer(answerData);
          
        } else if (content.startsWith("VIDEO_CALL_ICE:")) {
          console.log("Received ICE candidate from:", senderId);
          const iceData = JSON.parse(content.replace("VIDEO_CALL_ICE:", ""));
          videoCallState.setVideoCallIceCandidate(iceData);
          
        } else if (content === "VIDEO_CALL_END") {
          console.log("Received video call end signal from:", senderId);
          videoCallState.setShowVideoCall(false);
          videoCallState.setShowCallPickup(false);
          videoCallState.resetVideoCallState();
          
          toast({
            title: "Call Ended",
            description: "The other participant ended the video call",
          });
          
        } else if (content === "VIDEO_CALL_DECLINED") {
          console.log("Received video call declined signal from:", senderId);
          videoCallState.setShowVideoCall(false);
          videoCallState.setShowCallPickup(false);
          videoCallState.resetVideoCallState();
          
          toast({
            title: "Call Declined",
            description: "The other participant declined the video call",
            variant: "destructive",
          });
          
        } else if (content === "VIDEO_CALL_ACCEPTED") {
          console.log("Remote user accepted the call");
          toast({
            title: "Call Accepted",
            description: "The other participant accepted your call",
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
