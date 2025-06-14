
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
            className="max-w-xs rounded-2xl cursor-pointer shadow-sm"
            onClick={() => window.open(message.media_url, "_blank")}
          />
        </div>
      );
    case "video":
      return (
        <div className="mt-2">
          <video src={message.media_url} controls className="max-w-xs rounded-2xl shadow-sm" preload="metadata" />
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
      <div className="flex items-center justify-center h-full text-gray-500 py-20">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No messages yet</p>
          <p className="text-sm opacity-70">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((m, index) => {
        if (isSignalingMsg(m.content)) return null;
        
        const isOwn = m.sender_id === currentUserId;
        const prevMessage = messages[index - 1];
        const showTime = !prevMessage || 
          new Date(m.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

        return (
          <div key={m.id} className="flex flex-col">
            {showTime && (
              <div className="text-center text-xs text-gray-400 my-2">
                {new Date(m.created_at).toLocaleTimeString([], { 
                  hour: "2-digit", 
                  minute: "2-digit",
                  hour12: true 
                })}
              </div>
            )}
            <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-purple-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-900 mr-auto"
                } ${
                  isOwn ? "rounded-br-md" : "rounded-bl-md"
                }`}
              >
                <div className="break-words">{m.content}</div>
                {renderMediaMessage(m)}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default MessageList;
