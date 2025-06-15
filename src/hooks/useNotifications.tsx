
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePushNotifications } from "./usePushNotifications";
import { useNavigate } from "react-router-dom";

export interface NotificationData {
  id: string;
  type: 'subscription' | 'comment' | 'comment_reply' | 'like' | 'follow' | 'live_stream' | 'tip' | 'message' | 'story_like';
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

  // Dispatch custom event to notify other components of notification updates
  const dispatchNotificationUpdate = () => {
    window.dispatchEvent(new CustomEvent('notificationUpdate'));
  };

  const fetchNotifications = async () => {
    if (!user) {
      console.log('No user, skipping notification fetch');
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
        return;
      }

      console.log('Raw notifications data:', data);

      if (!data || data.length === 0) {
        console.log('No notifications found');
        setNotifications([]);
        return;
      }

      // Fetch user details for each notification
      const userIds = data
        .map(n => n.related_user_id)
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index);

      console.log('Fetching user profiles for:', userIds);

      let profiles = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profiles = profilesData || [];
        }
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

      // Notify other components of the update
      dispatchNotificationUpdate();
      
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

      // Notify other components of the update
      dispatchNotificationUpdate();
      
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

      // Notify other components of the update
      dispatchNotificationUpdate();
      
      toast.success("Notification deleted");
      
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    console.log('Notification clicked:', notification);

    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // First priority: Use the canonical URL from metadata (same as social sharing)
    const canonicalUrl = notification.metadata?.canonical_url;
    if (canonicalUrl) {
      console.log('Using canonical URL from metadata:', canonicalUrl);
      window.location.href = canonicalUrl;
      return;
    }

    // Fallback: Extract data and build URL
    const type = notification.type;
    const meta = notification.metadata || {};
    const contentType =
      meta.related_content_type ||
      meta.content_type ||
      meta.contentCategory ||
      "";
    const contentId = notification.related_id;
    const slug = meta.slug;
    let goto = "";

    // Improved strict resolution
    const lowerType = (contentType || "").toLowerCase();
    const byType = (type || "").toLowerCase();

    if (byType === "comment" || byType === "comment_reply" || byType === "like") {
      // If it's a comment/like on any content type...
      if (lowerType === "content" && (slug || contentId)) {
        goto = slug ? `/content/${slug}` : `/content/${contentId}`;
      } else if (lowerType === "post" && contentId) {
        goto = `/posts/${contentId}`;
      } else if (lowerType === "vibe" && (slug || contentId)) {
        goto = slug ? `/vibes/${slug}` : `/vibes/${contentId}`;
      } else {
        // Fallback: if only slug and slug pattern
        if (slug && meta.fallback_type === "content") {
          goto = `/content/${slug}`;
        } else if (slug && meta.fallback_type === "vibe") {
          goto = `/vibes/${slug}`;
        }
      }
    } else if (byType === "story_like" && lowerType === "story" && contentId) {
      goto = `/story/${contentId}`;
    } else if (lowerType === "content" && (slug || contentId)) {
      goto = slug ? `/content/${slug}` : `/content/${contentId}`;
    } else if (lowerType === "vibe" && (slug || contentId)) {
      goto = slug ? `/vibes/${slug}` : `/vibes/${contentId}`;
    } else if (byType === 'follow' && notification.user?.id) {
      goto = `/creator/${notification.user.id}`;
    } else if (byType === 'subscription' || byType === 'tip') {
      goto = `/profile`;
    } else if (byType === 'live_stream' && contentId) {
      goto = `/watch/${contentId}`;
    } else if (byType === 'message') {
      goto = `/dm`;
    }

    // STRONGER fallback for "post" type: only go to /posts if confirmed
    if (goto.startsWith("/posts/") && lowerType !== "post") {
      // Don't redirect to posts if type is not post!
      console.warn("Blocked misdirected /posts redirect for notification", notification);
      toast.info("Notification is not related to a post!");
      goto = "";
    }

    if (goto) {
      window.location.href = goto;
    } else {
      toast.info('Unknown notification destination!');
      console.warn("Notification did not resolve to a destination:", notification);
    }
  };

  useEffect(() => {
    console.log('useNotifications: User changed, fetching notifications');
    fetchNotifications();
  }, [user]);

  // Single real-time subscription for all notification events
  useEffect(() => {
    if (!user) return;

    let isSubscribed = false;
    const channelName = `notifications_realtime_${user.id}`;
    console.log('Setting up SINGLE real-time notifications channel:', channelName);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: user.id }
      }
    });

    // Only subscribe once
    if (!isSubscribed) {
      channel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('New notification received via realtime:', payload);
            
            const newNotification = payload.new;
            showNotification(newNotification.title, newNotification.message);
            toast.success(`New notification: ${newNotification.title}`);
            
            // Refresh notifications to get the complete data
            setTimeout(() => {
              console.log('Refreshing notifications due to realtime event');
              fetchNotifications();
              dispatchNotificationUpdate();
            }, 100);
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
            dispatchNotificationUpdate();
          }
        )
        .subscribe((status) => {
          console.log('Real-time notification channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          }
        });
    }

    return () => {
      console.log('Cleaning up real-time notification channel:', channelName);
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id to prevent recreation

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
