
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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

  const checkNotificationPreference = (type: string): boolean => {
    switch (type) {
      case 'subscription':
      case 'tip':
        return settings.tips;
      case 'follow':
        return settings.newFollowers;
      case 'like':
      case 'comment':
      case 'comment_reply':
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
