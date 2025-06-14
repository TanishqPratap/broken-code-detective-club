
import { MessageCircle } from "lucide-react";
import React from "react";

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio";
  created_at: string;
  updated_at: string;
}

interface MessageListProps {
  messages: MessageRow[];
  currentUserId: string;
}

const renderMediaMessage = (message: MessageRow) => {
  if (!message.media_url || !message.media_type) return null;
  switch (message.media_type) {
    case "image":
      return (
        <div className="mt-2">
          <img
            src={message.media_url}
            alt="Shared"
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(message.media_url, "_blank")}
          />
        </div>
      );
    case "video":
      return (
        <div className="mt-2">
          <video src={message.media_url} controls className="max-w-xs rounded-lg" preload="metadata" />
        </div>
      );
    case "audio":
      return (
        <div className="mt-2">
          <audio src={message.media_url} controls className="max-w-xs" preload="metadata" />
        </div>
      );
    default:
      return null;
  }
};

const isSignalingMsg = (content: string) =>
  content.startsWith("VIDEO_CALL_OFFER:") ||
  content.startsWith("VIDEO_CALL_ANSWER:") ||
  content.startsWith("VIDEO_CALL_ICE:") ||
  content === "VIDEO_CALL_END" ||
  content === "VIDEO_CALL_DECLINED";

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  if (!messages.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }
  return (
    <>
      {messages.map((m) => {
        if (isSignalingMsg(m.content)) return null;
        return (
          <div
            key={m.id}
            className={`max-w-[70%] ${m.sender_id === currentUserId ? "ml-auto bg-purple-100 text-right" : "mr-auto bg-gray-100 text-left"} px-3 py-1 rounded`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {m.sender_id === currentUserId ? "You" : "Them"}
              <span className="ml-2 text-[10px]">
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div>{m.content}</div>
            {renderMediaMessage(m)}
          </div>
        );
      })}
    </>
  );
};

export default MessageList;
