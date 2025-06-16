
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import BottomNavigation from "./BottomNavigation";
import MobileTopBar from "./MobileTopBar";

const MobileLayout = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

          if (error) {
            console.error('Error fetching unread count:', error);
            setUnreadCount(0);
            return;
          }
          
          setUnreadCount(count || 0);
        } catch (error) {
          console.error('Error in fetchUnreadCount:', error);
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (user) {
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .then(({ count }) => {
            setUnreadCount(count || 0);
          });
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <MobileTopBar onAuthClick={handleAuthClick} />
      
      <main className="pt-16 pb-4">
        <Outlet />
      </main>
      
      <BottomNavigation unreadCount={unreadCount} />
      
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
};

export default MobileLayout;
