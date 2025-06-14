
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Paperclip, Image, Video, Mic, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TipModal from "./TipModal";

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
  const [showTipModal, setShowTipModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Fetch chat session info (creator & subscriber IDs)
  const [sessionInfo, setSessionInfo] = useState<{ creator_id: string; subscriber_id: string; } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chat_sessions").select("creator_id,subscriber_id").eq("id", sessionId).maybeSingle();
      setSessionInfo(data ?? null);
    })();
  }, [sessionId]);

  // Load messages between these two users
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
        // Map the data to ensure proper typing
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

    // Subscribe to new messages (realtime)
    const channel = supabase
      .channel("dm")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
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
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [sessionInfo, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadMedia = async (file: File): Promise<{ url: string; type: 'image' | 'video' | 'audio' } | null> => {
    try {
      setUploadingMedia(true);
      
      // Determine media type based on file type
      let mediaType: 'image' | 'video' | 'audio';
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      } else {
        throw new Error('Unsupported file type');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      return { url: publicUrl, type: mediaType };
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload media file. Please try again.",
        variant: "destructive",
      });
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

    const recipient_id =
      currentUserId === sessionInfo.creator_id
        ? sessionInfo.subscriber_id
        : sessionInfo.creator_id;

    await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id,
      content: `Sent a ${mediaResult.type}`,
      media_url: mediaResult.url,
      media_type: mediaResult.type
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionInfo) return;
    setLoading(true);
    const recipient_id =
      currentUserId === sessionInfo.creator_id
        ? sessionInfo.subscriber_id
        : sessionInfo.creator_id;

    await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id,
      content: input.trim()
    });
    setInput("");
    setLoading(false);
  };

  const handleTipSent = async (amount: number, message?: string) => {
    if (!sessionInfo) return;

    const recipient_id =
      currentUserId === sessionInfo.creator_id
        ? sessionInfo.subscriber_id
        : sessionInfo.creator_id;

    // Send a message indicating a tip was sent
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id,
      content: `💰 Sent a tip of $${amount}${message ? `: ${message}` : ''}`
    });

    toast({
      title: "Tip Sent!",
      description: `Successfully sent $${amount} tip`,
    });
  };

  const renderMediaMessage = (message: MessageRow) => {
    if (!message.media_url || !message.media_type) return null;

    switch (message.media_type) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={message.media_url} 
              alt="Shared image" 
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
              onClick={() => window.open(message.media_url, '_blank')}
            />
          </div>
        );
      case 'video':
        return (
          <div className="mt-2">
            <video 
              src={message.media_url} 
              controls 
              className="max-w-xs rounded-lg"
              preload="metadata"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2">
            <audio 
              src={message.media_url} 
              controls 
              className="max-w-xs"
              preload="metadata"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!sessionInfo) return <div className="p-4">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[400px] border rounded-lg shadow p-4 bg-white">
      <div className="font-bold flex items-center gap-2 mb-2">
        <MessageCircle className="w-5 h-5" />
        Paid Direct Messages
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((m) => (
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
              <span className="ml-2 text-[10px]">{new Date(m.created_at).toLocaleTimeString()}</span>
            </div>
            <div>{m.content}</div>
            {renderMediaMessage(m)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      <div className="space-y-2">
        {/* Media Upload and Tip Buttons */}
        <div className="flex gap-2 justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
            className="flex items-center gap-1"
          >
            <Paperclip className="w-3 h-3" />
            {uploadingMedia ? "Uploading..." : "Media"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
              }
            }}
            disabled={uploadingMedia}
          >
            <Image className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "video/*";
                fileInputRef.current.click();
              }
            }}
            disabled={uploadingMedia}
          >
            <Video className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "audio/*";
                fileInputRef.current.click();
              }
            }}
            disabled={uploadingMedia}
          >
            <Mic className="w-3 h-3" />
          </Button>
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

        {/* Text Message Form */}
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || uploadingMedia}
          />
          <Button type="submit" disabled={loading || !input.trim() || uploadingMedia}>
            Send
          </Button>
        </form>
      </div>

      {/* Tip Modal */}
      {showTipModal && sessionInfo && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          recipientId={currentUserId === sessionInfo.creator_id ? sessionInfo.subscriber_id : sessionInfo.creator_id}
          onTipSent={handleTipSent}
        />
      )}
    </div>
  );
};

export default PaidDMChat;
