
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import NotificationItem from "@/components/NotificationItem";
import { Card } from "@/components/ui/card";

const Notifications = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick
  } = useNotifications();

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Group notifications by time periods
  const getTimeGroup = (timestamp: string, createdAt: string) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInHours = (now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'today';
    } else if (diffInHours < 168) { // 7 days
      return 'thisWeek';
    } else {
      return 'older';
    }
  };

  const groupedNotifications = {
    today: filteredNotifications.filter(n => getTimeGroup(n.timestamp, n.created_at) === 'today'),
    thisWeek: filteredNotifications.filter(n => getTimeGroup(n.timestamp, n.created_at) === 'thisWeek'),
    older: filteredNotifications.filter(n => getTimeGroup(n.timestamp, n.created_at) === 'older')
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="ml-64 p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
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
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
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

          {/* Notifications by time groups */}
          <div className="space-y-6">
            {groupedNotifications.today.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Today</h3>
                <div className="space-y-2">
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNotifications.thisWeek.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">This week</h3>
                <div className="space-y-2">
                  {groupedNotifications.thisWeek.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedNotifications.older.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Earlier</h3>
                <div className="space-y-2">
                  {groupedNotifications.older.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Empty state */}
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
