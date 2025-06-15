
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationData {
  id: string;
  type: 'subscription' | 'comment' | 'like' | 'follow' | 'live_stream' | 'tip' | 'message' | 'story_like';
  title: string;
  message: string;
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
  related_id?: string;
  metadata?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          is_read,
          created_at,
          related_content_id,
          related_content_type,
          metadata,
          related_user:related_user_id(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedNotifications: NotificationData[] = data.map((notification: any) => {
        const relatedUser = notification.related_user;
        const timeAgo = getTimeAgo(notification.created_at);
        
        return {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          user: {
            id: relatedUser?.id || '',
            username: relatedUser?.username || 'Unknown',
            display_name: relatedUser?.display_name,
            avatar_url: relatedUser?.avatar_url,
            is_verified: relatedUser?.is_verified || false
          },
          content: notification.metadata?.comment_text || notification.metadata?.message,
          post_preview: notification.related_content_type === 'post' ? 
            'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop' : undefined,
          timestamp: timeAgo,
          is_read: notification.is_read,
          action_text: notification.message,
          created_at: notification.created_at,
          related_id: notification.related_content_id,
          metadata: notification.metadata
        };
      });

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast.success("All notifications marked as read");
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
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
      case 'subscription':
        window.location.href = `/profile`;
        break;
      case 'tip':
        window.location.href = `/profile`;
        break;
      case 'live_stream':
        if (notification.related_id) {
          window.location.href = `/watch/${notification.related_id}`;
        }
        break;
      case 'message':
        window.location.href = `/dm`;
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

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New notification received:', payload);
          // Refetch notifications to get the complete data with relations
          fetchNotifications();
          toast.success('New notification received!');
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          // Update the specific notification in state
          const updatedNotification = payload.new;
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedNotification.id 
                ? { ...notif, is_read: updatedNotification.is_read }
                : notif
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
