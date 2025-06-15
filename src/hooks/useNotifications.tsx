
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePushNotifications } from "./usePushNotifications";

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
  const { showNotification } = usePushNotifications();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      
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
          related_user_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Raw notifications data:', data);

      if (!data || data.length === 0) {
        console.log('No notifications found');
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Fetch user details for each notification
      const userIds = data
        .map(n => n.related_user_id)
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      console.log('Fetching user profiles for:', userIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles data:', profiles);

      const transformedNotifications: NotificationData[] = data.map((notification: any) => {
        const relatedUser = profiles?.find(p => p.id === notification.related_user_id);
        const timeAgo = getTimeAgo(notification.created_at);
        
        return {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          user: {
            id: relatedUser?.id || notification.related_user_id || '',
            username: relatedUser?.username || 'Unknown User',
            display_name: relatedUser?.display_name,
            avatar_url: relatedUser?.avatar_url,
            is_verified: relatedUser?.is_verified || false
          },
          content: notification.metadata?.comment_text || 
                  notification.metadata?.message || 
                  notification.metadata?.message_preview,
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

      console.log('Transformed notifications:', transformedNotifications);
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
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
    if (!user) return;

    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
    } catch (error) {
      console.error('Error in markAsRead:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      console.log('Marking all notifications as read for user:', user.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast.success("All notifications marked as read");
      
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      console.log('Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      toast.success("Notification deleted");
      
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Create a test notification function for debugging
  const createTestNotification = async () => {
    if (!user) return;

    try {
      console.log('Creating test notification for user:', user.id);
      
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'like',
        p_title: 'Test Notification',
        p_message: 'This is a test notification to verify the system is working',
        p_related_user_id: user.id,
        p_metadata: { test: true }
      });

      if (error) {
        console.error('Error creating test notification:', error);
        throw error;
      }

      console.log('Test notification created successfully');
      toast.success('Test notification created!');
      fetchNotifications();
      
    } catch (error) {
      console.error('Error in createTestNotification:', error);
      toast.error('Failed to create test notification');
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    console.log('Notification clicked:', notification);
    
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
      case 'story_like':
        window.location.href = `/creator/${notification.user.id}`;
        break;
      default:
        console.log('Unknown notification type:', notification.type);
        break;
    }
  };

  useEffect(() => {
    console.log('useNotifications: User changed, fetching notifications');
    fetchNotifications();
  }, [user]);

  // Set up real-time notifications listener with better error handling
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time notifications for user:', user.id);

    const channel = supabase
      .channel(`notifications_realtime_${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      })
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New notification received via realtime:', payload);
          fetchNotifications();
          
          const newNotification = payload.new;
          showNotification(newNotification.title, newNotification.message);
          toast.success(`New notification: ${newNotification.title}`);
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
          console.log('Notification updated via realtime:', payload);
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
      .subscribe((status) => {
        console.log('Notification channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications channel');
        } else if (status === 'TIMED_OUT') {
          console.warn('Notification subscription timed out, attempting to reconnect...');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log('Reconnecting to notifications...');
            fetchNotifications();
          }, 5000);
        }
      });

    return () => {
      console.log('Cleaning up notification channel');
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    refetch: fetchNotifications,
    createTestNotification // Add this for debugging
  };
};
