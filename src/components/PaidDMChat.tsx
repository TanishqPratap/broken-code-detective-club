import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, DollarSign, Trash2, ArrowLeft, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TipModal from "./TipModal";
import MediaUploader from "./PaidDM/MediaUploader";
import MessageList, { MessageRow } from "./PaidDM/MessageList";
import ChatInput from "./PaidDM/ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaidDMChatProps {
  sessionId: string;
  currentUserId: string;
  onBack: () => void;
}

const PaidDMChat = ({ sessionId, currentUserId, onBack }: PaidDMChatProps) => {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [sessionInfo, setSessionInfo] = useState<{ 
    creator_id: string; 
    subscriber_id: string;
    hourly_rate: number;
    otherUser?: {
      display_name: string | null;
      username: string;
      avatar_url: string | null;
    };
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select(`
          creator_id,
          subscriber_id,
          hourly_rate,
          creator_profile:profiles!chat_sessions_creator_id_fkey(display_name, username, avatar_url),
          subscriber_profile:profiles!chat_sessions_subscriber_id_fkey(display_name, username, avatar_url)
        `)
        .eq("id", sessionId)
        .maybeSingle();
      
      if (data) {
        const isCreator = currentUserId === data.creator_id;
        const otherProfile = isCreator ? data.subscriber_profile : data.creator_profile;
        
        setSessionInfo({
          creator_id: data.creator_id,
          subscriber_id: data.subscriber_id,
          hourly_rate: data.hourly_rate,
          otherUser: otherProfile || undefined
        });
      }
    })();
  }, [sessionId, currentUserId]);

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

  const otherUserName = sessionInfo.otherUser?.display_name || sessionInfo.otherUser?.username || "Unknown User";

  return (
    <>
      <div className="flex flex-col h-screen bg-white">
        {/* Instagram-like Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={sessionInfo.otherUser?.avatar_url || undefined} />
              <AvatarFallback>
                {otherUserName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-sm">{otherUserName}</h2>
              <p className="text-xs text-gray-500">${Number(sessionInfo.hourly_rate).toFixed(2)}/hr</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowTipModal(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Send Tip
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    disabled={clearingChat || messages.length === 0}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Chat
                  </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <MessageList messages={messages} currentUserId={currentUserId} />
          <div ref={bottomRef} />
        </div>

        {/* Instagram-like Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <MediaUploader uploadingMedia={uploadingMedia} onUpload={uploadMedia} />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTipModal(true)} 
              className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
            >
              <DollarSign className="w-3 h-3" /> 
              Tip
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
