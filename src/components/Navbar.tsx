
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Bell, User, Video, Heart, MessageSquare, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavbarProps {
  onAuthClick: () => void;
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
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

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/posts", icon: Heart, label: "Posts" },
    { path: "/vibes", icon: Video, label: "Vibes" },
    { path: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { path: "/live", icon: Video, label: "Live" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          Creator Hub
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive("/creator")
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    Creator Studio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dm"
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
          <Button onClick={onAuthClick} className="w-full">
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
