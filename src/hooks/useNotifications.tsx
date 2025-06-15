
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationData {
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
  created_at: string;
  related_id?: string; // ID of related post, stream, etc.
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Simulate fetching notifications from various sources
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
          created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          post_preview: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop',
          related_id: 'post_1'
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
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          content: 'Process Oriented',
          post_preview: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop',
          related_id: 'post_2'
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
          is_read: true,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          related_id: 'follow_1'
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
          is_read: true,
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          related_id: 'tip_1'
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
          is_read: true,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          related_id: 'stream_1'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      // In a real app, you would update this in the database
      console.log('Marking notification as read:', notificationId);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      // In a real app, you would update all notifications in the database
      console.log('Marking all notifications as read');
      toast.success("All notifications marked as read");
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      // In a real app, you would delete this from the database
      console.log('Deleting notification:', notificationId);
      toast.success("Notification deleted");
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to related content based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.related_id) {
          window.location.href = `/posts/${notification.related_id}`;
        }
        break;
      case 'follow':
        window.location.href = `/creator/${notification.user.id}`;
        break;
      case 'tip':
        window.location.href = `/profile`;
        break;
      case 'live':
        if (notification.related_id) {
          window.location.href = `/watch/${notification.related_id}`;
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Set up real-time notifications listener
  useEffect(() => {
    if (!user) return;

    // In a real app, you would set up a real-time subscription here
    const setupRealtimeSubscription = () => {
      console.log('Setting up real-time notifications for user:', user.id);
      
      // Example: Listen for new notifications
      // const channel = supabase
      //   .channel('notifications')
      //   .on('postgres_changes', 
      //     { 
      //       event: 'INSERT', 
      //       schema: 'public', 
      //       table: 'notifications',
      //       filter: `user_id=eq.${user.id}`
      //     }, 
      //     (payload) => {
      //       // Add new notification to state
      //       console.log('New notification:', payload);
      //       // You would transform the payload and add it to notifications state
      //     }
      //   )
      //   .subscribe();

      // return () => {
      //   supabase.removeChannel(channel);
      // };
    };

    return setupRealtimeSubscription();
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    refetch: fetchNotifications
  };
};
