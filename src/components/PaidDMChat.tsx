import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, DollarSign, Trash2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TipModal from "./TipModal";
import StreamVideoCall from "./StreamVideoCall";
import CallPickupModal from "./CallPickupModal";
import MediaUploader from "./PaidDM/MediaUploader";
import MessageList, { MessageRow } from "./PaidDM/MessageList";
import ChatInput from "./PaidDM/ChatInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStreamVideoCall } from "@/hooks/useStreamVideoCall";

interface PaidDMChatProps {
  sessionId: string;
  currentUserId: string;
}

const PaidDMChat = ({ sessionId, currentUserId }: PaidDMChatProps) => {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<{ creator_id: string; subscriber_id: string; } | null>(null);

  const streamVideoCall = useStreamVideoCall({
    sessionInfo,
    currentUserId,
    onCallMessage: async (content: string) => {
      if (!sessionInfo) return;
      const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id,
        content,
      });
    },
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("creator_id,subscriber_id")
        .eq("id", sessionId)
        .maybeSingle();
      console.log("Loaded session info:", data);
      setSessionInfo(data ?? null);
    })();
  }, [sessionId]);

  const handleMessageReceived = useCallback((message: MessageRow) => {
    console.log("=== NEW MESSAGE RECEIVED ===", message);
    
    const isForThisConversation = 
      (message.sender_id === sessionInfo?.creator_id && message.recipient_id === sessionInfo?.subscriber_id) ||
      (message.sender_id === sessionInfo?.subscriber_id && message.recipient_id === sessionInfo?.creator_id);
    
    if (isForThisConversation) {
      setMessages((prev) => [...prev, { ...message }]);
      
      if (message.content.startsWith("STREAM_VIDEO_CALL_") && message.sender_id !== currentUserId) {
        streamVideoCall.processSignalingMessage(message.content, message.sender_id);
      }
    }
  }, [sessionInfo, currentUserId, streamVideoCall.processSignalingMessage]);

  const setupRealtimeConnection = useCallback(() => {
    if (!sessionInfo) {
      console.log("No session info available for realtime connection");
      return null;
    }

    console.log("=== Setting up simplified realtime connection ===");
    setConnectionStatus("connecting");
    
    if (channelRef.current) {
      console.log("Cleaning up existing channel");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `chat-${sessionId}`;
    console.log("Creating channel:", channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `sender_id=in.(${sessionInfo.creator_id},${sessionInfo.subscriber_id})`
        },
        (payload) => {
          const message = payload.new as MessageRow;
          handleMessageReceived(message);
        }
      )
      .subscribe((status) => {
        console.log("=== CHANNEL STATUS UPDATE ===", status);
        setConnectionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          console.log("✅ Successfully subscribed to realtime channel");
          reconnectAttemptsRef.current = 0;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error("❌ Channel connection failed:", status);
          setConnectionStatus("failed");
          
          if (reconnectAttemptsRef.current < 3) {
            reconnectAttemptsRef.current++;
            console.log(`Retrying connection... Attempt ${reconnectAttemptsRef.current}/3`);
            
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect...");
              setupRealtimeConnection();
            }, 2000 * reconnectAttemptsRef.current);
          } else {
            console.error("Max reconnection attempts reached");
            toast({
              title: "Connection Failed",
              description: "Unable to establish real-time connection. Video calls may not work properly.",
              variant: "destructive",
            });
          }
        }
      });

    channelRef.current = channel;
    return channel;
  }, [sessionInfo, sessionId, handleMessageReceived, toast]);

  useEffect(() => {
    let ignore = false;
    if (!sessionInfo) return;
    
    async function fetchMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${sessionInfo.creator_id},recipient_id.eq.${sessionInfo.subscriber_id}),and(sender_id.eq.${sessionInfo.subscriber_id},recipient_id.eq.${sessionInfo.creator_id})`
        )
        .order("created_at");
      if (!ignore && Array.isArray(data)) {
        const typedMessages: MessageRow[] = data.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          recipient_id: m.recipient_id,
          content: m.content,
          created_at: m.created_at,
          updated_at: m.updated_at,
          media_url: m.media_url || undefined,
          media_type: (m.media_type === 'image' || m.media_type === 'video' || m.media_type === 'audio') ? m.media_type : undefined,
        }));
        setMessages(typedMessages);
      }
    }
    fetchMessages();

    const channel = setupRealtimeConnection();

    return () => {
      ignore = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionInfo, setupRealtimeConnection]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadMedia = async (file: File) => {
    if (!sessionInfo) return;
    try {
      setUploadingMedia(true);
      let mediaType: 'image' | 'video' | 'audio';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';
      else throw new Error('Unsupported file type');
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id,
        content: `Sent a ${mediaType}`,
        media_url: publicUrl,
        media_type: mediaType,
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      toast({ title: "Upload Error", description: "Failed to upload media file.", variant: "destructive" });
    } finally {
      setUploadingMedia(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text || !sessionInfo) return;
    setLoading(true);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    
    try {
      await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: text });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!sessionInfo) return;
    setClearingChat(true);
    try {
      const { error } = await supabase.rpc("clear_chat", {
        user1_id: sessionInfo.creator_id,
        user2_id: sessionInfo.subscriber_id,
      });
      if (error) throw error;
      setMessages([]);
      toast({ title: "Chat Cleared", description: "All messages deleted." });
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast({ title: "Error", description: "Failed to clear chat.", variant: "destructive" });
    } finally {
      setClearingChat(false);
    }
  };

  const handleTipSent = useCallback(
    async (amount: number, message?: string) => {
      if (!sessionInfo) return;
      const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
      try {
        await supabase.from("messages").insert({
          sender_id: currentUserId,
          recipient_id,
          content: `💰 Sent a tip of $${amount}${message ? `: ${message}` : ""}`,
        });
      } catch (error) {
        console.error("Error inserting tip message:", error);
        toast({
          title: "Error",
          description: "Failed to display tip message.",
          variant: "destructive",
        });
      }
    },
    [sessionInfo, currentUserId, toast]
  );

  if (!sessionInfo) return <div className="p-4">Loading chat...</div>;

  return (
    <>
      <div className="flex flex-col h-[400px] border rounded-lg shadow p-4 bg-white">
        <div className="font-bold flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Paid Direct Messages
            {connectionStatus !== 'SUBSCRIBED' && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                {connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'failed' ? 'Connection Failed' : connectionStatus}
              </span>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={clearingChat || messages.length === 0}
                className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
                Clear Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all messages in this conversation? This action cannot be undone and will clear the chat for both participants.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearChat}
                  disabled={clearingChat}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {clearingChat ? "Clearing..." : "Clear Chat"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          <MessageList messages={messages} currentUserId={currentUserId} />
          <div ref={bottomRef} />
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 justify-center">
            <MediaUploader uploadingMedia={uploadingMedia} onUpload={uploadMedia} />
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTipModal(true)} className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50" >
              <DollarSign className="w-3 h-3" /> Tip
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={streamVideoCall.startVideoCall} 
              disabled={uploadingMedia || streamVideoCall.showVideoCall || streamVideoCall.showCallPickup} 
              className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50" 
            >
              <Video className="w-3 h-3" /> Video Call
            </Button>
          </div>
          <ChatInput loading={loading || uploadingMedia} onSend={sendMessage} />
        </div>
        {showTipModal && sessionInfo && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            recipientId={
              currentUserId === sessionInfo.creator_id
                ? sessionInfo.subscriber_id
                : sessionInfo.creator_id
            }
            onTipSent={handleTipSent}
          />
        )}
      </div>
      
      <CallPickupModal 
        isOpen={streamVideoCall.showCallPickup} 
        callerName={streamVideoCall.incomingCallFrom} 
        onAccept={streamVideoCall.acceptCall} 
        onDecline={streamVideoCall.declineCall} 
      />
      
      {streamVideoCall.showVideoCall && streamVideoCall.callId && (
        <StreamVideoCall
          callId={streamVideoCall.callId}
          onCallEnd={streamVideoCall.endCall}
          isInitiator={streamVideoCall.isInitiator}
        />
      )}
    </>
  );
};

export default PaidDMChat;
