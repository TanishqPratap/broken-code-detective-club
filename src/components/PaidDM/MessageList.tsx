
import { MessageCircle, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio";
  created_at: string;
  updated_at: string;
  is_one_time_media?: boolean;
  viewed_at?: string;
}

interface MessageListProps {
  messages: MessageRow[];
  currentUserId: string;
}

const OneTimeMediaView = ({ message, currentUserId }: { message: MessageRow; currentUserId: string }) => {
  const [isViewing, setIsViewing] = useState(false);
  const [hasViewed, setHasViewed] = useState(!!message.viewed_at);
  const { toast } = useToast();

  const handleViewOneTimeMedia = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasViewed) return;
    
    try {
      // Mark as viewed in database
      const { error } = await supabase
        .from('messages')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', message.id);

      if (error) throw error;

      setIsViewing(true);
      setHasViewed(true);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsViewing(false);
      }, 10000);
    } catch (error) {
      console.error('Error marking media as viewed:', error);
      toast({
        title: "Error",
        description: "Failed to view media",
        variant: "destructive",
      });
    }
  };

  const isRecipient = message.recipient_id === currentUserId;
  const canView = isRecipient && !hasViewed;
  const shouldShowMedia = isViewing || !isRecipient; // Sender can always see their sent media

  if (hasViewed && isRecipient && !isViewing) {
    return (
      <div className="mt-2 p-3 border border-gray-200 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <EyeOff className="w-4 h-4" />
          One-time media (viewed)
        </div>
      </div>
    );
  }

  if (!shouldShowMedia) {
    return (
      <div className="mt-2">
        <button
          onClick={handleViewOneTimeMedia}
          onTouchEnd={handleViewOneTimeMedia}
          disabled={!canView}
          className={`p-3 border border-purple-200 rounded-2xl flex items-center gap-2 transition-colors touch-manipulation ${
            canView 
              ? 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200 cursor-pointer' 
              : 'bg-gray-50 cursor-not-allowed'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Eye className="w-4 h-4 text-purple-500" />
          <span className="text-sm text-purple-700">
            {canView ? 'Tap to view once' : 'One-time media'}
          </span>
        </button>
      </div>
    );
  }

  // Show the actual media
  return (
    <div className="mt-2">
      {isViewing && (
        <div className="mb-2 text-xs text-orange-600 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Viewing for 10 seconds...
        </div>
      )}
      {renderMedia(message)}
    </div>
  );
};

const renderMedia = (message: MessageRow) => {
  if (!message.media_url || !message.media_type) return null;
  
  switch (message.media_type) {
    case "image":
      return (
        <img
          src={message.media_url}
          alt="Shared"
          className="max-w-xs rounded-2xl cursor-pointer shadow-sm"
          onClick={() => window.open(message.media_url, "_blank")}
        />
      );
    case "video":
      return (
        <video src={message.media_url} controls className="max-w-xs rounded-2xl shadow-sm" preload="metadata" />
      );
    case "audio":
      return (
        <audio src={message.media_url} controls className="max-w-xs" preload="metadata" />
      );
    default:
      return null;
  }
};

const renderMediaMessage = (message: MessageRow, currentUserId: string) => {
  if (!message.media_url || !message.media_type) return null;
  
  if (message.is_one_time_media) {
    return <OneTimeMediaView message={message} currentUserId={currentUserId} />;
  }
  
  return <div className="mt-2">{renderMedia(message)}</div>;
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
                {renderMediaMessage(m, currentUserId)}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default MessageList;
