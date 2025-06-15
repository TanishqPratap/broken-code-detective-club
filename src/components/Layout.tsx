
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AuthModal from "./auth/AuthModal";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  // If mobile is detected, this layout shouldn't render
  // The mobile layout will be used instead
  if (isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Navbar onAuthClick={handleAuthClick} />
      <main className="flex-1 ml-64">
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
};

export default Layout;
