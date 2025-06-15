
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NotificationSettings {
  pushEnabled: boolean;
  newPosts: boolean;
  newFollowers: boolean;
  liveStreams: boolean;
  directMessages: boolean;
  tips: boolean;
}

const NotificationSystem = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    newPosts: true,
    newFollowers: true,
    liveStreams: true,
    directMessages: true,
    tips: true,
  });

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load user's notification settings
    loadNotificationSettings();
  }, [user]);

  const loadNotificationSettings = async () => {
    // In a real app, this would load from the database
    const saved = localStorage.getItem(`notifications_${user?.id}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveNotificationSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(newSettings));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Notifications enabled successfully!');
        saveNotificationSettings({ ...settings, pushEnabled: true });
        
        // Send a test notification
        new Notification('CreatorHub Notifications', {
          body: 'You will now receive notifications for new activities!',
          icon: '/favicon.ico',
        });
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const disableNotifications = () => {
    saveNotificationSettings({ ...settings, pushEnabled: false });
    toast.success('Notifications disabled');
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveNotificationSettings(newSettings);
  };

  const sendTestNotification = () => {
    if (permission === 'granted' && settings.pushEnabled) {
      new Notification('Test Notification', {
        body: 'This is a test notification from CreatorHub!',
        icon: '/favicon.ico',
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Please enable notifications first');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications from CreatorHub
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notification Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {settings.pushEnabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <Label className="text-base font-medium">Push Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {permission === 'granted' 
                  ? 'Receive browser notifications' 
                  : 'Enable to receive real-time updates'}
              </p>
            </div>
          </div>
          
          {permission === 'granted' ? (
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  saveNotificationSettings({ ...settings, pushEnabled: true });
                } else {
                  disableNotifications();
                }
              }}
            />
          ) : (
            <Button onClick={requestNotificationPermission} size="sm">
              Enable
            </Button>
          )}
        </div>

        {/* Notification Categories */}
        {settings.pushEnabled && (
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-posts">New posts from creators you follow</Label>
                <Switch
                  id="new-posts"
                  checked={settings.newPosts}
                  onCheckedChange={(checked) => updateSetting('newPosts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="new-followers">New followers</Label>
                <Switch
                  id="new-followers"
                  checked={settings.newFollowers}
                  onCheckedChange={(checked) => updateSetting('newFollowers', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="live-streams">Live stream notifications</Label>
                <Switch
                  id="live-streams"
                  checked={settings.liveStreams}
                  onCheckedChange={(checked) => updateSetting('liveStreams', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="direct-messages">Direct messages</Label>
                <Switch
                  id="direct-messages"
                  checked={settings.directMessages}
                  onCheckedChange={(checked) => updateSetting('directMessages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="tips">Tips and earnings</Label>
                <Switch
                  id="tips"
                  checked={settings.tips}
                  onCheckedChange={(checked) => updateSetting('tips', checked)}
                />
              </div>
            </div>

            <Button 
              onClick={sendTestNotification} 
              variant="outline" 
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Browser Support Info */}
        {!('Notification' in window) && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your browser doesn't support notifications. Please use a modern browser for the best experience.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSystem;
