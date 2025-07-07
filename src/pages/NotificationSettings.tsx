
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import NotificationSystem from "@/components/NotificationSystem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const NotificationSettings = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
        <div className={`${isMobile ? 'px-4 py-4' : 'ml-64 p-8'} flex items-center justify-center min-h-[calc(100vh-80px)]`}>
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in to manage notifications</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to configure your notification preferences.</p>
            <Button onClick={() => setShowAuthModal(true)}>
              Sign In
            </Button>
          </Card>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
      
      <div className={`${isMobile ? 'px-4 py-4' : 'ml-64 p-4 sm:p-6'} max-w-2xl`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          </div>
          
          <NotificationSystem />
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default NotificationSettings;
