
import { useParams } from "react-router-dom";
import LivestreamViewer from "@/components/LivestreamViewer";
import StreamAccessChecker from "@/components/StreamAccessChecker";
import Layout from "@/components/Layout";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const Watch = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!streamId) {
    return (
      <Layout onAuthClick={() => setShowAuthModal(true)}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Stream Not Found</h1>
          <p className="text-gray-600">The requested stream could not be found.</p>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </Layout>
    );
  }

  return (
    <Layout onAuthClick={() => setShowAuthModal(true)}>
      <StreamAccessChecker streamId={streamId}>
        <LivestreamViewer streamId={streamId} creatorId="" />
      </StreamAccessChecker>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </Layout>
  );
};

export default Watch;
