
import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "./Navbar";
import MobileLayout from "./MobileLayout";
import AuthModal from "@/components/auth/AuthModal";

const Layout = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  // Use mobile layout for mobile devices
  if (isMobile) {
    return <MobileLayout />;
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Navbar />
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
