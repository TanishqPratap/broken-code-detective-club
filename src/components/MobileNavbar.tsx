
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, Video, Heart, MessageSquare, Menu, X, ShoppingBag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

interface MobileNavbarProps {
  onAuthClick: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const MobileNavbar = ({ onAuthClick }: MobileNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Bottom navigation items - expanded to include all navigation
  const bottomNavItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/vibes", icon: Video, label: "Vibes" },
    { path: "/creator", icon: Briefcase, label: "Studio" },
    { path: "/profile", icon: User, label: "Profile" },
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/posts", icon: Heart, label: "Posts" },
    { path: "/vibes", icon: Video, label: "Vibes" },
    { path: "/marketplace", icon: ShoppingBag, label: "Shop" },
  ];

  // Secondary navigation items that appear in a second row for authenticated users
  const secondaryNavItems = user ? [
    { path: "/dm", icon: MessageSquare, label: "DM" },
    { path: "/notifications", icon: Bell, label: "Alerts", showBadge: true, badgeCount: unreadCount },
    { path: "/marketplace", icon: ShoppingBag, label: "Shop" },
    { 
      path: "/auth", 
      icon: X, 
      label: "Sign Out", 
      onClick: handleSignOut,
      isAction: true 
    },
  ] : [
    { 
      path: "/auth", 
      icon: User, 
      label: "Sign In", 
      onClick: onAuthClick,
      isAction: true 
    },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center px-4 z-40">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Creator Hub
        </Link>
      </div>

      {/* Primary Bottom Navigation Bar */}
      <div className="fixed bottom-12 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around z-40">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 relative ${
              isActive(item.path)
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Secondary Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around z-40">
        {secondaryNavItems.map((item) => (
          <div key={item.path}>
            {item.isAction ? (
              <button
                onClick={item.onClick}
                className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </button>
            ) : (
              <Link
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 relative ${
                  isActive(item.path)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.showBadge && item.badgeCount && item.badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-3 w-3 text-xs p-0 flex items-center justify-center min-w-3"
                    >
                      {item.badgeCount > 9 ? '9+' : item.badgeCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default MobileNavbar;
