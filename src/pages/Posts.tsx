
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import PostFeed from "@/components/PostFeed";

const Posts = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 ${isMobile ? '' : 'flex'}`}>
      {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
      
      <main className={`flex-1 ${isMobile ? '' : 'ml-64'}`}>
        <div className={`container mx-auto max-w-2xl ${isMobile ? 'px-4 py-4' : 'px-4 py-6 sm:py-8'}`}>
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Posts</h1>
            <p className="text-gray-600 text-sm sm:text-base">Share and discover amazing content</p>
          </div>

          <PostFeed />
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Posts;
