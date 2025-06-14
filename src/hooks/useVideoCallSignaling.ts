
import { useState, useCallback } from "react";
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
      try {
        if (content.startsWith("VIDEO_CALL_OFFER:")) {
          const offerData = JSON.parse(content.replace("VIDEO_CALL_OFFER:", ""));
          if (senderId !== currentUserId) {
            videoCallState.setVideoCallOffer(offerData);
            videoCallState.setVideoCallAnswer(null);
            videoCallState.setVideoCallIceCandidate(null);
            videoCallState.setIncomingCallFrom(
              senderId === sessionInfo?.creator_id ? "Creator" : "Subscriber"
            );
            videoCallState.setShowCallPickup(true);
          }
        } else if (content.startsWith("VIDEO_CALL_ANSWER:")) {
          const answerData = JSON.parse(content.replace("VIDEO_CALL_ANSWER:", ""));
          if (senderId !== currentUserId) {
            videoCallState.setVideoCallAnswer(answerData);
          }
        } else if (content.startsWith("VIDEO_CALL_ICE:")) {
          const iceData = JSON.parse(content.replace("VIDEO_CALL_ICE:", ""));
          if (senderId !== currentUserId) {
            videoCallState.setVideoCallIceCandidate(iceData);
          }
        } else if (content === "VIDEO_CALL_END") {
          if (senderId !== currentUserId) {
            videoCallState.setShowVideoCall(false);
            videoCallState.setShowCallPickup(false);
            videoCallState.resetVideoCallState();
            toast({
              title: "Call Ended",
              description: "The other participant ended the video call",
            });
          }
        } else if (content === "VIDEO_CALL_DECLINED") {
          if (senderId !== currentUserId) {
            videoCallState.setShowVideoCall(false);
            videoCallState.setShowCallPickup(false);
            videoCallState.resetVideoCallState();
            toast({
              title: "Call Declined",
              description: "The other participant declined the video call",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error parsing video call message:", error);
      }
    },
    [currentUserId, sessionInfo, videoCallState, toast]
  );
}
