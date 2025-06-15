
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, User, Video, Search, MessageSquare, Home, Compass, Film, Bell, PlusSquare, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";

interface MobileNavbarProps {
  onAuthClick: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const MobileNavbar = ({ onAuthClick, isSidebarOpen, toggleSidebar, closeSidebar }: MobileNavbarProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Simple fetch of unread count without real-time subscription
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          console.log('Fetching unread count for user:', user.id);
          
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
          
          console.log('Unread notification count:', count);
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

    // Refresh unread count every 30 seconds as a fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Listen for custom events from useNotifications hook to update count
  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (user) {
        // Refetch count when notifications are updated
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

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/search", label: "Search", icon: Search },
    { path: "/discover", label: "Explore", icon: Compass },
    { path: "/vibes", label: "Vibes", icon: Film },
    { path: "/dm", label: "Messages", icon: MessageSquare },
    { 
      path: "/notifications", 
      label: "Notifications", 
      icon: Bell,
      showBadge: unreadCount > 0,
      badgeCount: unreadCount
    },
    { path: "/creator", label: "Create", icon: PlusSquare },
    { path: "/live", label: "Live", icon: Video }
  ];

  const handleLogoClick = () => {
    closeSidebar();
  };

  const handleNavItemClick = () => {
    closeSidebar();
  };

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
          <Heart className="w-6 h-6 text-brand-blue" />
          <span className="text-xl font-bold bg-gradient-to-r from-brand-navy to-brand-blue bg-clip-text text-sky-600">
            CreatorHub
          </span>
        </Link>
        
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Link to="/" className="flex items-center space-x-3" onClick={handleLogoClick}>
            <Heart className="w-8 h-8 text-brand-blue" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-navy to-brand-blue bg-clip-text text-sky-600">
              CreatorHub
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map(({ path, label, icon: Icon, showBadge, badgeCount }) => (
              <Link key={`${path}-${label}`} to={path} onClick={handleNavItemClick}>
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive(path) 
                    ? "bg-brand-light-cyan dark:bg-brand-dark-blue font-semibold text-brand-navy dark:text-brand-light-cyan" 
                    : "hover:bg-brand-pale-cyan dark:hover:bg-gray-800"
                }`}>
                  <div className="flex items-center space-x-4">
                    <Icon className={`w-6 h-6 ${isActive(path) ? "text-brand-blue" : ""}`} />
                    <span className="text-base">{label}</span>
                  </div>
                  {showBadge && badgeCount && badgeCount > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="space-y-4">
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-brand-pale-cyan dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base">Profile</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center" onClick={handleNavItemClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/creator" className="flex items-center" onClick={handleNavItemClick}>
                      <Video className="mr-2 h-4 w-4" />
                      <span>Creator Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { signOut(); closeSidebar(); }}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => { onAuthClick(); closeSidebar(); }} className="w-full">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavbar;
