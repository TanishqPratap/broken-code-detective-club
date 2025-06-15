
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, UserPlus, Video, Star, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { toast } from "sonner";

interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'live' | 'tip' | 'story_like';
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
  };
  content?: string;
  post_preview?: string;
  timestamp: string;
  is_read: boolean;
  action_text: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Mock notification data - in real app, this would come from Supabase
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        type: 'like',
        user: {
          id: '1',
          username: 'network_issu_',
          display_name: 'Network Issue',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          is_verified: false
        },
        action_text: 'liked your post.',
        timestamp: '20h',
        is_read: false,
        post_preview: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop'
      },
      {
        id: '2',
        type: 'comment',
        user: {
          id: '2',
          username: 'tutti_futti__',
          display_name: 'Tutti Futti',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b9c027bc?w=100&h=100&fit=crop&crop=face'
        },
        action_text: 'commented on your post: "Amazing work! 🔥"',
        timestamp: '1d',
        is_read: true,
        content: 'Process Oriented',
        post_preview: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop'
      },
      {
        id: '3',
        type: 'follow',
        user: {
          id: '3',
          username: 'harsu______',
          display_name: 'Harsu',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
        },
        action_text: 'started following you.',
        timestamp: '3d',
        is_read: true
      },
      {
        id: '4',
        type: 'tip',
        user: {
          id: '4',
          username: 'iam_adityaa_pandey',
          display_name: 'Aditya Pandey',
          avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face'
        },
        action_text: 'sent you a tip of $5! "Keep up the great content"',
        timestamp: '4d',
        is_read: true
      },
      {
        id: '5',
        type: 'live',
        user: {
          id: '5',
          username: 'rahmansadan',
          display_name: 'Rahman Sadan',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        },
        action_text: 'went live: "Building Cool Tech Products"',
        timestamp: '5d',
        is_read: true
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'like':
        return <Heart className={`${iconClass} text-red-500 fill-current`} />;
      case 'comment':
        return <MessageCircle className={`${iconClass} text-blue-500`} />;
      case 'follow':
        return <UserPlus className={`${iconClass} text-green-500`} />;
      case 'live':
        return <Video className={`${iconClass} text-purple-500`} />;
      case 'tip':
        return <Gift className={`${iconClass} text-yellow-500`} />;
      default:
        return <Star className={`${iconClass} text-gray-500`} />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    );
    toast.success("All notifications marked as read");
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="ml-64 p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in to view notifications</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to see your notifications.</p>
            <Button onClick={() => setShowAuthModal(true)}>
              Sign In
            </Button>
          </Card>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="ml-64 p-4 sm:p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="px-4 py-2"
            >
              All
            </Button>
            <Button
              variant={activeTab === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('unread')}
              className="px-4 py-2 flex items-center gap-2"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Time sections */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Today</h3>
              <div className="space-y-2">
                {filteredNotifications
                  .filter(n => n.timestamp.includes('h') || n.timestamp === 'now')
                  .map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.user.avatar_url || ''} />
                            <AvatarFallback>
                              {(notification.user.display_name || notification.user.username)[0]?.toUpperCase()}
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
                                  {notification.action_text}
                                </span>
                              </p>
                              {notification.content && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.content}
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">This week</h3>
              <div className="space-y-2">
                {filteredNotifications
                  .filter(n => n.timestamp.includes('d'))
                  .map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.user.avatar_url || ''} />
                            <AvatarFallback>
                              {(notification.user.display_name || notification.user.username)[0]?.toUpperCase()}
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
                                  {notification.action_text}
                                </span>
                              </p>
                              {notification.content && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.content}
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'unread' 
                  ? 'You\'re all caught up!' 
                  : 'When people interact with your content, you\'ll see it here.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Notifications;
