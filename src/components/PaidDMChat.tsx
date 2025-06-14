import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Paperclip, Image, Video, Mic, DollarSign, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TipModal from "./TipModal";
import VideoCall from "./VideoCall";
import CallPickupModal from "./CallPickupModal";
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

interface PaidDMChatProps {
  sessionId: string;
  currentUserId: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  created_at: string;
  updated_at: string;
}

const PaidDMChat = ({ sessionId, currentUserId }: PaidDMChatProps) => {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showCallPickup, setShowCallPickup] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string>("");
  const [isVideoCallInitiator, setIsVideoCallInitiator] = useState(false);
  const [videoCallOffer, setVideoCallOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [videoCallAnswer, setVideoCallAnswer] = useState<RTCSessionDescriptionInit | null>(null);
  const [videoCallIceCandidate, setVideoCallIceCandidate] = useState<RTCIceCandidate | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<{ creator_id: string; subscriber_id: string; } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chat_sessions").select("creator_id,subscriber_id").eq("id", sessionId).maybeSingle();
      setSessionInfo(data ?? null);
    })();
  }, [sessionId]);

  const resetVideoCallState = useCallback(() => {
    setVideoCallOffer(null);
    setVideoCallAnswer(null);
    setVideoCallIceCandidate(null);
    setIsVideoCallInitiator(false);
  }, []); // Dependencies: state setters are stable

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
          media_type: (m.media_type === 'image' || m.media_type === 'video' || m.media_type === 'audio') 
            ? m.media_type 
            : undefined
        }));
        setMessages(typedMessages);
      }
    }
    fetchMessages();

    const channel = supabase
      .channel(`dm-${sessionId}`) // Unique channel per session
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as MessageRow; // Cast to MessageRow
          if (
            (m.sender_id === sessionInfo?.creator_id &&
              m.recipient_id === sessionInfo?.subscriber_id) ||
            (m.sender_id === sessionInfo?.subscriber_id &&
              m.recipient_id === sessionInfo?.creator_id)
          ) {
            const newMessage: MessageRow = {
              id: m.id,
              sender_id: m.sender_id,
              recipient_id: m.recipient_id,
              content: m.content,
              created_at: m.created_at,
              updated_at: m.updated_at,
              media_url: m.media_url || undefined,
              media_type: (m.media_type === 'image' || m.media_type === 'video' || m.media_type === 'audio') 
                ? m.media_type 
                : undefined
            };
            setMessages((prev) => [...prev, newMessage]);
            
            handleVideoCallMessage(m.content, m.sender_id);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to dm-${sessionId}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Subscription error on dm-${sessionId}:`, status, err);
        }
      });

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from dm-${sessionId}`);
    };
  }, [sessionInfo, sessionId, handleVideoCallMessage]); // Added handleVideoCallMessage

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadMedia = async (file: File): Promise<{ url: string; type: 'image' | 'video' | 'audio' } | null> => {
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
      return { url: publicUrl, type: mediaType };
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({ title: "Upload Error", description: "Failed to upload media file.", variant: "destructive" });
      return null;
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionInfo) return;

    const mediaResult = await uploadMedia(file);
    if (!mediaResult) return;

    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id,
      content: `Sent a ${mediaResult.type}`,
      media_url: mediaResult.url,
      media_type: mediaResult.type
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionInfo) return;
    setLoading(true);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: input.trim() });
    setInput("");
    setLoading(false);
  };

  const clearChat = async () => {
    if (!sessionInfo) return;
    setClearingChat(true);
    try {
      const { error } = await supabase.from("messages").delete()
        .or(`and(sender_id.eq.${sessionInfo.creator_id},recipient_id.eq.${sessionInfo.subscriber_id}),and(sender_id.eq.${sessionInfo.subscriber_id},recipient_id.eq.${sessionInfo.creator_id})`);
      if (error) throw error;
      setMessages([]);
      toast({ title: "Chat Cleared", description: "All messages deleted." });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({ title: "Error", description: "Failed to clear chat.", variant: "destructive" });
    } finally {
      setClearingChat(false);
    }
  };
  
  const handleTipSent = useCallback(async (amount: number, message?: string) => {
    if (!sessionInfo) return;
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    try {
      await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id,
        content: `💰 Sent a tip of $${amount}${message ? `: ${message}` : ''}`
      });
    } catch (error) {
      console.error('Error inserting tip message:', error);
      toast({ title: "Error", description: "Failed to display tip message.", variant: "destructive" });
    }
  }, [sessionInfo, currentUserId, toast]);

  const renderMediaMessage = (message: MessageRow) => {
    if (!message.media_url || !message.media_type) return null;
    switch (message.media_type) {
      case 'image': return <div className="mt-2"><img src={message.media_url} alt="Shared" className="max-w-xs rounded-lg cursor-pointer" onClick={() => window.open(message.media_url, '_blank')} /></div>;
      case 'video': return <div className="mt-2"><video src={message.media_url} controls className="max-w-xs rounded-lg" preload="metadata" /></div>;
      case 'audio': return <div className="mt-2"><audio src={message.media_url} controls className="max-w-xs" preload="metadata" /></div>;
      default: return null;
    }
  };

  const handleVideoCallMessage = useCallback((content: string, senderId: string) => {
    try {
      if (content.startsWith('VIDEO_CALL_OFFER:')) {
        const offerData = JSON.parse(content.replace('VIDEO_CALL_OFFER:', ''));
        if (senderId !== currentUserId) {
          console.log('Received video call offer:', offerData);
          setVideoCallOffer(offerData);
          setVideoCallAnswer(null); 
          setVideoCallIceCandidate(null); 
          
          setIncomingCallFrom(senderId === sessionInfo?.creator_id ? "Creator" : "Subscriber");
          setShowCallPickup(true);
        }
      } else if (content.startsWith('VIDEO_CALL_ANSWER:')) {
        const answerData = JSON.parse(content.replace('VIDEO_CALL_ANSWER:', ''));
        if (senderId !== currentUserId) {
          console.log('Received video call answer:', answerData);
          setVideoCallAnswer(answerData);
        }
      } else if (content.startsWith('VIDEO_CALL_ICE:')) {
        const iceData = JSON.parse(content.replace('VIDEO_CALL_ICE:', ''));
        if (senderId !== currentUserId) {
          console.log('Received ICE candidate:', iceData);
          setVideoCallIceCandidate(iceData);
        }
      } else if (content === 'VIDEO_CALL_END') {
        if (senderId !== currentUserId) {
          setShowVideoCall(false);
          setShowCallPickup(false);
          resetVideoCallState();
          toast({
            title: "Call Ended",
            description: "The other participant ended the video call",
          });
        }
      } else if (content === 'VIDEO_CALL_DECLINED') {
        if (senderId !== currentUserId) {
          setShowVideoCall(false);
          setShowCallPickup(false);
          resetVideoCallState();
          toast({
            title: "Call Declined",
            description: "The other participant declined the video call",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error parsing video call message:', error);
    }
  }, [currentUserId, sessionInfo, resetVideoCallState, toast]);

  const startVideoCall = useCallback(async () => {
    if (!sessionInfo) return;
    console.log('Starting video call as initiator');
    resetVideoCallState(); // Ensure clean state before starting
    setShowVideoCall(true);
    setIsVideoCallInitiator(true);
    
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: "📹 Started a video call" });
  }, [sessionInfo, currentUserId, resetVideoCallState]);

  const acceptCall = useCallback(() => {
    console.log('Accepting incoming video call');
    setShowCallPickup(false);
    setShowVideoCall(true);
    setIsVideoCallInitiator(false); // Receiver is not the initiator
  }, []); // No dependencies that change

  const declineCall = useCallback(async () => {
    if (!sessionInfo) return;
    console.log('Declining incoming video call');
    setShowCallPickup(false);
    resetVideoCallState();
    
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: "VIDEO_CALL_DECLINED" });
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: "📹 Video call declined" });
  }, [sessionInfo, currentUserId, resetVideoCallState]);

  const handleVideoCallOfferCreated = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!sessionInfo) return;
    console.log('Sending video call offer:', offer);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: `VIDEO_CALL_OFFER:${JSON.stringify(offer)}` });
  }, [sessionInfo, currentUserId]);

  const handleVideoCallAnswerCreated = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!sessionInfo) return;
    console.log('Sending video call answer:', answer);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: `VIDEO_CALL_ANSWER:${JSON.stringify(answer)}` });
  }, [sessionInfo, currentUserId]);

  const handleVideoCallIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (!sessionInfo) return;
    console.log('Sending ICE candidate:', candidate);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: `VIDEO_CALL_ICE:${JSON.stringify(candidate)}` });
  }, [sessionInfo, currentUserId]);

  const endVideoCall = useCallback(async () => {
    if (!sessionInfo) return;
    console.log('Ending video call from PaidDMChat');
    setShowVideoCall(false);
    setShowCallPickup(false); // Ensure pickup modal is also closed
    resetVideoCallState();
    
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    // Send specific "END" signal
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: "VIDEO_CALL_END" });
    // Send user-friendly message
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: "📹 Video call ended" });
  }, [sessionInfo, currentUserId, resetVideoCallState]);

  if (!sessionInfo) return <div className="p-4">Loading chat...</div>;

  return (
    <>
      <div className="flex flex-col h-[400px] border rounded-lg shadow p-4 bg-white">
        <div className="font-bold flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Paid Direct Messages
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
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              if (m.content.startsWith('VIDEO_CALL_OFFER:') || 
                  m.content.startsWith('VIDEO_CALL_ANSWER:') || 
                  m.content.startsWith('VIDEO_CALL_ICE:') ||
                  m.content === 'VIDEO_CALL_END' ||
                  m.content === 'VIDEO_CALL_DECLINED') {
                return null;
              }

              return (
                <div
                  key={m.id}
                  className={`max-w-[70%] ${
                    m.sender_id === currentUserId
                      ? "ml-auto bg-purple-100 text-right"
                      : "mr-auto bg-gray-100 text-left"
                  } px-3 py-1 rounded`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.sender_id === currentUserId ? "You" : "Them"}
                    <span className="ml-2 text-[10px]">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>{m.content}</div>
                  {renderMediaMessage(m)}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2 justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="flex items-center gap-1"> <Paperclip className="w-3 h-3" /> {uploadingMedia ? "Uploading..." : "Media"} </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }}} disabled={uploadingMedia} > <Image className="w-3 h-3" /> </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "video/*"; fileInputRef.current.click(); }}} disabled={uploadingMedia} > <Video className="w-3 h-3" /> </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "audio/*"; fileInputRef.current.click(); }}} disabled={uploadingMedia} > <Mic className="w-3 h-3" /> </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTipModal(true)} className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50" > <DollarSign className="w-3 h-3" /> Tip </Button>
            <Button type="button" variant="outline" size="sm" onClick={startVideoCall} disabled={uploadingMedia || showVideoCall || showCallPickup} className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50" > <Video className="w-3 h-3" /> Video Call </Button>
          </div>

          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); sendMessage(); }} >
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." disabled={loading || uploadingMedia} />
            <Button type="submit" disabled={loading || !input.trim() || uploadingMedia}> Send </Button>
          </form>
        </div>

        {showTipModal && sessionInfo && (
          <TipModal isOpen={showTipModal} onClose={() => setShowTipModal(false)} recipientId={currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id} onTipSent={handleTipSent} />
        )}
      </div>

      <CallPickupModal isOpen={showCallPickup} callerName={incomingCallFrom} onAccept={acceptCall} onDecline={declineCall} />

      {showVideoCall && (
        <VideoCall
          isInitiator={isVideoCallInitiator}
          onClose={endVideoCall} // Now memoized
          onOfferCreated={handleVideoCallOfferCreated} // Now memoized
          onAnswerCreated={handleVideoCallAnswerCreated} // Now memoized
          onIceCandidateGenerated={handleVideoCallIceCandidate} // Now memoized
          remoteOffer={videoCallOffer}
          remoteAnswer={videoCallAnswer}
          remoteIceCandidate={videoCallIceCandidate}
        />
      )}
    </>
  );
};

export default PaidDMChat;
