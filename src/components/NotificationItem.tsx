
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, UserPlus, Video, Star, DollarSign, Users, MoreHorizontal } from "lucide-react";
import { NotificationData } from "@/hooks/useNotifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: NotificationData) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) => {
  console.log('Rendering notification item:', notification);

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'like':
        return <Heart className={`${iconClass} text-red-500 fill-current`} />;
      case 'story_like':
        return <Heart className={`${iconClass} text-pink-500 fill-current`} />;
      case 'comment':
        return <MessageCircle className={`${iconClass} text-blue-500`} />;
      case 'comment_reply':
        return <MessageCircle className={`${iconClass} text-purple-500`} />;
      case 'follow':
        return <UserPlus className={`${iconClass} text-green-500`} />;
      case 'live_stream':
        return <Video className={`${iconClass} text-purple-500`} />;
      case 'tip':
        return <DollarSign className={`${iconClass} text-yellow-500`} />;
      case 'subscription':
        return <Users className={`${iconClass} text-indigo-500`} />;
      case 'message':
        return <MessageCircle className={`${iconClass} text-blue-500`} />;
      default:
        return <Star className={`${iconClass} text-gray-500`} />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on dropdown or buttons
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick(notification);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer group ${
        !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={notification.user.avatar_url || ''} />
              <AvatarFallback>
                {(notification.user.display_name || notification.user.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              {getNotificationIcon(notification.type)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-gray-900">
                    {notification.user.display_name || notification.user.username}
                  </span>
                  {notification.user.is_verified && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                  <span className="text-gray-600 ml-1">
                    {notification.message}
                  </span>
                </p>
                {notification.content && (
                  <p className="text-xs text-gray-500 mt-1">
                    "{notification.content}"
                  </p>
                )}
                {notification.metadata?.amount && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ${notification.metadata.amount}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-3">
                <span className="text-xs text-gray-500">
                  {notification.timestamp}
                </span>
                {notification.post_preview && (
                  <img 
                    src={notification.post_preview} 
                    alt="Post preview" 
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                
                {/* Dropdown menu for actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild data-dropdown-trigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.is_read && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      Delete notification
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;
