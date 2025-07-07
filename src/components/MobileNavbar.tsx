
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, Video, Heart, MessageSquare, Menu, X, ShoppingBag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileNavbarProps {
  onAuthClick: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const MobileNavbar = ({ onAuthClick, isSidebarOpen, toggleSidebar, closeSidebar }: MobileNavbarProps) => {
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
      closeSidebar();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/posts", icon: Heart, label: "Posts" },
    { path: "/vibes", icon: Video, label: "Vibes" },
    { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { path: "/live", icon: Video, label: "Live" },
  ];

  // Bottom navigation items for authenticated users
  const bottomNavItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/dm", icon: MessageSquare, label: "DM", showBadge: false },
    { path: "/creator", icon: Briefcase, label: "Studio" },
    { path: "/notifications", icon: Bell, label: "Alerts", showBadge: true, badgeCount: unreadCount },
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/posts", icon: Heart, label: "Posts" },
    { path: "/vibes", icon: Video, label: "Vibes" },
    { path: "/marketplace", icon: ShoppingBag, label: "Shop" },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-40">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Creator Hub
        </Link>
        
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around z-40">
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
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.showBadge && item.badgeCount && item.badgeCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center min-w-4"
                >
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </Badge>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Sidebar Overlay - Higher z-index to appear above everything */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-lg font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={closeSidebar}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {user && (
                  <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ul className="space-y-2">
                      <li>
                        <Link
                          to="/creator"
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive("/creator")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Briefcase className="w-5 h-5" />
                          Creator Studio
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/dm"
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive("/dm")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <MessageSquare className="w-5 h-5" />
                          Paid DMs
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/notifications"
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive("/notifications")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Bell className="w-5 h-5" />
                          <span className="flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/profile"
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive("/profile")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <User className="w-5 h-5" />
                          Profile
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </nav>
            </ScrollArea>

            {/* Auth Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Signed in as {user.email}
                  </p>
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => { onAuthClick(); closeSidebar(); }} className="w-full">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;
