
import { useParams } from "react-router-dom";
import LivestreamViewer from "@/components/LivestreamViewer";
import StreamAccessChecker from "@/components/StreamAccessChecker";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const Watch = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!streamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Stream Not Found</h1>
            <p className="text-gray-600">The requested stream could not be found.</p>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      <StreamAccessChecker streamId={streamId}>
        <LivestreamViewer streamId={streamId} creatorId="" />
      </StreamAccessChecker>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Watch;
