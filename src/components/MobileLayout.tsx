
import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import MobileNavbar from "./MobileNavbar";

const MobileLayout = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileNavbar 
        onAuthClick={handleAuthClick}
        isSidebarOpen={false}
        toggleSidebar={() => {}}
        closeSidebar={() => {}}
      />
      
      {/* Main content with proper spacing for top navigation and double bottom navigation */}
      <main className="pt-16 pb-28 min-h-screen">
        <div className="w-full">
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
};

export default MobileLayout;
