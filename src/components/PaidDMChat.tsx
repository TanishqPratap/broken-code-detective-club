
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface PaidDMChatProps {
  sessionId: string;
  currentUserId: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

const PaidDMChat = ({ sessionId, currentUserId }: PaidDMChatProps) => {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat session info (creator & subscriber IDs)
  const [sessionInfo, setSessionInfo] = useState<{ creator_id: string; subscriber_id: string; } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chat_sessions").select("creator_id,subscriber_id").eq("id", sessionId).maybeSingle();
      setSessionInfo(data ?? null);
    })();
  }, [sessionId]);

  // Load messages
  useEffect(() => {
    let ignore = false;
    if (!sessionInfo) return;
    async function fetchMessages() {
      // Simple: filter messages where (sender and recipient in this chat session)
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${sessionInfo.creator_id},recipient_id.eq.${sessionInfo.subscriber_id}),and(sender_id.eq.${sessionInfo.subscriber_id},recipient_id.eq.${sessionInfo.creator_id})`
        )
        .order("created_at");
      if (!ignore && data) setMessages(data);
    }
    fetchMessages();

    // Subscribe to new messages (realtime)
    const channel = supabase
      .channel("dm")
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m: MessageRow = payload.new;
          // Only add if relevant to this session
          if (
            (m.sender_id === sessionInfo?.creator_id && m.recipient_id === sessionInfo?.subscriber_id)
            || (m.sender_id === sessionInfo?.subscriber_id && m.recipient_id === sessionInfo?.creator_id)
          ) {
            setMessages((prev) => [...prev, m]);
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
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
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
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default PaidDMChat;
