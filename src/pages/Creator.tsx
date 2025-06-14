import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import CreatorDashboard from "@/components/CreatorDashboard";
import LivestreamDashboard from "@/components/LivestreamDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreatorSidebar from "@/components/CreatorSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import PaidDMModal from "@/components/PaidDMModal";
import PaidDMChat from "@/components/PaidDMChat";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const Creator = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [showPaidDM, setShowPaidDM] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null);
  const [creatorDMProps, setCreatorDMProps] = useState<{
    creatorId: string;
    creatorName: string;
    chatRate: number;
  } | null>(null);

  // Simulate "self" as creator
  const CREATOR_PROFILE = {
    id: user?.id ?? "",
    name: user?.user_metadata?.display_name || user?.email || "Unknown",
    chatRate: user?.chat_rate || 20 // fallback rate
  };

  // handleOpenPaidDM: To start a paid DM session (could pass these as props from a child card/list)
  const handleOpenPaidDM = () => {
    setCreatorDMProps({
      creatorId: CREATOR_PROFILE.id,
      creatorName: CREATOR_PROFILE.name,
      chatRate: CREATOR_PROFILE.chatRate
    });
    setShowPaidDM(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Creator Access Required</CardTitle>
              <CardDescription>
                Please sign in to access the creator dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      <SidebarProvider>
        <div className="flex w-full max-w-[1400px] mx-auto px-4 py-8 gap-6">
          <CreatorSidebar active={activeSection} onSelect={setActiveSection} />
          <main className="flex-1 min-w-0">
            <div className="mb-8 flex items-center gap-4">
              <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
              {user && (
                <Button variant="secondary" onClick={handleOpenPaidDM}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Paid DM
                </Button>
              )}
            </div>
            {/* If paid DM session started, show PaidDMChat */}
            {activeChatSession ? (
              <PaidDMChat sessionId={activeChatSession} currentUserId={user.id} />
            ) : (
              <>
                {activeSection === "overview" && <CreatorDashboard />}
                {activeSection === "livestream" && <LivestreamDashboard />}
                {activeSection === "content" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Management</CardTitle>
                      <CardDescription>
                        Upload and manage your premium content
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-gray-500 py-8">
                        Content management coming soon...
                      </p>
                    </CardContent>
                  </Card>
                )}
                {activeSection === "settings" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Creator Settings</CardTitle>
                      <CardDescription>
                        Configure your creator preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-gray-500 py-8">
                        Creator settings coming soon...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </SidebarProvider>
      {/* Paid DM modal */}
      {creatorDMProps && (
        <PaidDMModal
          open={showPaidDM}
          onClose={() => setShowPaidDM(false)}
          creatorId={creatorDMProps.creatorId}
          creatorName={creatorDMProps.creatorName}
          chatRate={creatorDMProps.chatRate}
          onSessionCreated={sessionId => setActiveChatSession(sessionId)}
        />
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Creator;
