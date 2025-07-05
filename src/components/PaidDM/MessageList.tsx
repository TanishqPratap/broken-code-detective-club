import { MessageCircle, Eye, EyeOff, Timer } from "lucide-react";
import React, { useState, useEffect } from "react";
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
  const [countdown, setCountdown] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const { toast } = useToast();

  // Get video duration when component mounts
  useEffect(() => {
    if (message.media_type === 'video' && message.media_url) {
      const video = document.createElement('video');
      video.src = message.media_url;
      video.onloadedmetadata = () => {
        setVideoDuration(Math.ceil(video.duration)); // Round up to nearest second
      };
    }
  }, [message.media_url, message.media_type]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isViewing && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isViewing && countdown === 0) {
      setIsViewing(false);
    }
    return () => clearTimeout(timer);
  }, [isViewing, countdown]);

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
      
      // Set countdown based on media type
      if (message.media_type === 'video' && videoDuration) {
        setCountdown(videoDuration);
      } else {
        setCountdown(10); // Default 10 seconds for images and audio
      }
      
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
      <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <EyeOff className="w-4 h-4" />
          </div>
          <span>Opened</span>
        </div>
      </div>
    );
  }

  if (!shouldShowMedia) {
    const getMediaTypeText = () => {
      if (message.media_type === 'video') {
        return videoDuration ? `Video • ${videoDuration}s • View once` : 'Video • View once';
      }
      return `${message.media_type === 'image' ? 'Photo' : 'Audio'} • View once`;
    };

    return (
      <div className="mt-2">
        <button
          onClick={handleViewOneTimeMedia}
          onTouchEnd={handleViewOneTimeMedia}
          disabled={!canView}
          className={`relative p-4 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200 w-full ${
            canView 
              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 active:scale-95 cursor-pointer shadow-sm hover:shadow-md' 
              : 'border-gray-300 bg-gray-50 cursor-not-allowed'
          }`}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            minHeight: '120px'
          }}
        >
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-700 mb-1">
              {canView ? 'Tap to view' : `One-time ${message.media_type}`}
            </div>
            <div className="text-xs text-purple-600">
              {canView ? getMediaTypeText() : 'Already opened'}
            </div>
          </div>
          {canView && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
          )}
        </button>
      </div>
    );
  }

  // Show the actual media with countdown
  return (
    <div className="mt-2 relative">
      {isViewing && countdown > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-black/80 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
          <Timer className="w-4 h-4" />
          {countdown}s
        </div>
      )}
      {isViewing && (
        <div className="absolute top-2 right-2 z-10 bg-black/80 text-white px-3 py-1 rounded-full text-xs">
          Tap and hold to replay
        </div>
      )}
      <div className={`relative overflow-hidden rounded-2xl ${isViewing ? 'ring-2 ring-purple-500' : ''}`}>
        {renderMedia(message)}
        {isViewing && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        )}
      </div>
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
          className="max-w-xs w-full rounded-2xl cursor-pointer shadow-sm"
          onClick={() => window.open(message.media_url, "_blank")}
          style={{ maxHeight: '400px', objectFit: 'cover' }}
        />
      );
    case "video":
      return (
        <video 
          src={message.media_url} 
          controls 
          className="max-w-xs w-full rounded-2xl shadow-sm" 
          preload="metadata"
          style={{ maxHeight: '400px' }}
        />
      );
    case "audio":
      return (
        <audio src={message.media_url} controls className="max-w-xs w-full" preload="metadata" />
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
