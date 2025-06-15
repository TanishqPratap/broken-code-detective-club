
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettings {
  pushEnabled: boolean;
  newPosts: boolean;
  newFollowers: boolean;
  liveStreams: boolean;
  directMessages: boolean;
  tips: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    newPosts: true,
    newFollowers: true,
    liveStreams: true,
    directMessages: true,
    tips: true,
  });

  const loadSettings = () => {
    if (user) {
      const saved = localStorage.getItem(`notifications_${user.id}`);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  };

  const showNotification = (title: string, body: string, icon?: string) => {
    if (!settings.pushEnabled || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'creator-hub-notification',
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  // Listen for new notifications from the database
  useEffect(() => {
    if (!user || !settings.pushEnabled) return;

    const channel = supabase
      .channel('push-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          const notification = payload.new;
          console.log('New notification for push:', notification);
          
          // Check if user wants this type of notification
          const shouldShow = checkNotificationPreference(notification.type);
          
          if (shouldShow) {
            showNotification(notification.title, notification.message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, settings]);

  const checkNotificationPreference = (type: string): boolean => {
    switch (type) {
      case 'subscription':
      case 'tip':
        return settings.tips;
      case 'follow':
        return settings.newFollowers;
      case 'like':
      case 'comment':
        return settings.newPosts;
      case 'live_stream':
        return settings.liveStreams;
      case 'message':
        return settings.directMessages;
      default:
        return true;
    }
  };

  return {
    settings,
    showNotification,
    loadSettings,
  };
};
