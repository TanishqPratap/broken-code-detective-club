
import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  unreadCount?: number;
}

const BottomNavigation = ({ unreadCount = 0 }: BottomNavigationProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const tabs = [
    {
      path: "/",
      icon: Home,
      label: "Home"
    },
    {
      path: "/search",
      icon: Search,
      label: "Search"
    },
    {
      path: "/creator",
      icon: PlusSquare,
      label: "Create"
    },
    {
      path: "/notifications",
      icon: Heart,
      label: "Activity",
      showBadge: unreadCount > 0,
      badgeCount: unreadCount
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabs.map(({ path, icon: Icon, label, showBadge, badgeCount }) => (
          <Link
            key={path}
            to={path}
            className="flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative"
          >
            <div className="relative">
              <Icon 
                className={`w-6 h-6 ${
                  isActive(path) 
                    ? "text-gray-900 dark:text-white" 
                    : "text-gray-400 dark:text-gray-500"
                }`} 
                fill={isActive(path) ? "currentColor" : "none"}
              />
              {showBadge && badgeCount && badgeCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 text-xs h-4 w-4 p-0 flex items-center justify-center min-w-4"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Badge>
              )}
            </div>
            <span className="sr-only">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
