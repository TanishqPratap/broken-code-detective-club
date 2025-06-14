
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, DollarSign, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TipModal from "./TipModal";
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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<{ creator_id: string; subscriber_id: string; } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("creator_id,subscriber_id")
        .eq("id", sessionId)
        .maybeSingle();
      setSessionInfo(data ?? null);
    })();
  }, [sessionId]);

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

    const channel = supabase
      .channel(`dm-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as MessageRow;
          console.log("New message received:", {
            sender: m.sender_id,
            recipient: m.recipient_id,
            content: m.content.substring(0, 50),
            isFromOtherUser: m.sender_id !== currentUserId
          });
          
          if (
            (m.sender_id === sessionInfo?.creator_id &&
              m.recipient_id === sessionInfo?.subscriber_id) ||
            (m.sender_id === sessionInfo?.subscriber_id &&
              m.recipient_id === sessionInfo?.creator_id)
          ) {
            setMessages((prev) => [...prev, { ...m }]);
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [sessionInfo, sessionId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- MEDIA UPLOAD logic extracted out ---
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

  // --- SENDING MESSAGE (text) ---
  const sendMessage = async (text: string) => {
    if (!text || !sessionInfo) return;
    setLoading(true);
    const recipient_id = currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id;
    await supabase.from("messages").insert({ sender_id: currentUserId, recipient_id, content: text });
    setLoading(false);
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
    </>
  );
};

export default PaidDMChat;
