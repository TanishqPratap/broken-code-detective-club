
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

      // Enhanced validation
      if (!sessionInfo) {
        console.error("No session info available for signaling");
        return;
      }

      // Validate sender is part of this session
      const isValidSender = senderId === sessionInfo.creator_id || senderId === sessionInfo.subscriber_id;
      if (!isValidSender) {
        console.log("Ignoring signaling from user not in this session:", senderId);
        return;
      }

      console.log("Processing signaling message from:", senderId);

      try {
        if (content.startsWith("VIDEO_CALL_OFFER:")) {
          console.log("=== PROCESSING VIDEO CALL OFFER ===");
          
          const offerJson = content.replace("VIDEO_CALL_OFFER:", "");
          console.log("Extracted offer JSON:", offerJson);
          
          let offerData;
          try {
            offerData = JSON.parse(offerJson);
          } catch (parseError) {
            console.error("Failed to parse offer JSON:", parseError);
            toast({
              title: "Call Error",
              description: "Invalid call data received",
              variant: "destructive",
            });
            return;
          }
          
          console.log("Parsed offer data:", offerData);
          
          // Determine caller name based on session info
          let callerName = "Unknown User";
          if (senderId === sessionInfo.creator_id) {
            callerName = "Creator";
          } else if (senderId === sessionInfo.subscriber_id) {
            callerName = "Subscriber";
          }
          
          console.log("=== SETTING UP PICKUP MODAL ===");
          console.log("Caller name:", callerName);
          
          // Reset and set new state
          videoCallState.resetVideoCallState();
          videoCallState.setVideoCallOffer(offerData);
          videoCallState.setIncomingCallFrom(callerName);
          videoCallState.setIsVideoCallInitiator(false);
          
          // Show pickup modal
          console.log("Showing pickup modal");
          videoCallState.setShowCallPickup(true);
          
          toast({
            title: "Incoming Video Call",
            description: `${callerName} is calling you`,
          });
          
        } else if (content.startsWith("VIDEO_CALL_ANSWER:")) {
          console.log("Received video call answer from:", senderId);
          const answerJson = content.replace("VIDEO_CALL_ANSWER:", "");
          let answerData;
          try {
            answerData = JSON.parse(answerJson);
            videoCallState.setVideoCallAnswer(answerData);
          } catch (parseError) {
            console.error("Failed to parse answer JSON:", parseError);
          }
          
        } else if (content.startsWith("VIDEO_CALL_ICE:")) {
          console.log("Received ICE candidate from:", senderId);
          const iceJson = content.replace("VIDEO_CALL_ICE:", "");
          let iceData;
          try {
            iceData = JSON.parse(iceJson);
            videoCallState.setVideoCallIceCandidate(iceData);
          } catch (parseError) {
            console.error("Failed to parse ICE JSON:", parseError);
          }
          
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
        console.error("Error processing video call signaling message:", error);
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
