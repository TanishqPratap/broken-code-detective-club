
import { ReactNode, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User, Video, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MobileLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleNavigation = (path: string) => {
    if (!user && (path === '/creator' || path === '/notifications' || path === '/profile')) {
      setShowAuthModal(true);
      return;
    }
    navigate(path);
  };

  const navigationItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: PlusSquare, path: '/creator', label: 'Create' },
    { icon: Video, path: '/live', label: 'Live' },
    { icon: Heart, path: '/notifications', label: 'Activity' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <main className="flex-1">
          <div className="w-full min-h-screen px-4 py-6">
            <Outlet />
          </div>
        </main>
        
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Vibes
          </h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleNavigation('/notifications')}
              className="relative p-2"
            >
              <Heart className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleNavigation('/dm')}
              className="relative p-2"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sticky bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-colors",
                  isActive 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      
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
