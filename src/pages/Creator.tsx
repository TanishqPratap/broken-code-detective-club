
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import CreatorDashboard from "@/components/CreatorDashboard";
import LivestreamDashboard from "@/components/LivestreamDashboard";
import ContentManagement from "@/components/ContentManagement";
import CreatorSettings from "@/components/CreatorSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreatorSidebar from "@/components/CreatorSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import PaidDMModal from "@/components/PaidDMModal";
import PaidDMChat from "@/components/PaidDMChat";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Creator = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [showPaidDM, setShowPaidDM] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [creatorDMProps, setCreatorDMProps] = useState<{
    creatorId: string;
    creatorName: string;
    creatorChatRate: number;
    subscriberId: string;
  } | null>(null);

  // Check if we should navigate to livestream tab from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveSection(location.state.activeTab);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Simulate viewing another creator (in real use, pass another user's profile data)
  // For this demo, if user is logged in, treat them as both the viewer and the "creator"
  const CREATOR_PROFILE = {
    id: user?.id ?? "",
    name: user?.user_metadata?.display_name || user?.email || "Unknown",
    chatRate: typeof user?.user_metadata?.chat_rate === "number" ? Number(user.user_metadata.chat_rate) : user?.user_metadata?.chat_rate ? Number(user.user_metadata.chat_rate) : 20
  };

  const handleOpenPaidDM = () => {
    if (!user) return;
    setCreatorDMProps({
      creatorId: CREATOR_PROFILE.id,
      creatorName: CREATOR_PROFILE.name,
      creatorChatRate: CREATOR_PROFILE.chatRate,
      subscriberId: user.id
    });
    setShowPaidDM(true);
  };

  const handleNavigateToLivestream = () => {
    setActiveSection("livestream");
  };

  const handleNavigateToContent = () => {
    setActiveSection("content");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
        <div className={`${isMobile ? 'px-4 py-4' : 'container mx-auto px-4 py-16'}`}>
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

  // Mobile layout - render content directly without sidebar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <main className="w-full">
          {!activeSessionId && (
            <div className="mb-4 flex items-center gap-4 px-4 pt-4">
              <h1 className="text-2xl font-bold">Creator Studio</h1>
              <Button onClick={handleOpenPaidDM} variant="outline" className="ml-auto" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Test Paid DM
              </Button>
            </div>
          )}
          
          {activeSessionId && (
            <PaidDMChat 
              sessionId={activeSessionId} 
              currentUserId={user.id} 
              onBack={() => setActiveSessionId(null)} 
            />
          )}
          
          {!activeSessionId && activeSection === "overview" && (
            <CreatorDashboard 
              onNavigateToLivestream={handleNavigateToLivestream}
              onNavigateToContent={handleNavigateToContent}
            />
          )}
          {!activeSessionId && activeSection === "livestream" && <LivestreamDashboard />}
          {!activeSessionId && activeSection === "content" && <ContentManagement />}
          {!activeSessionId && activeSection === "settings" && <CreatorSettings />}
        </main>
        
        {/* Paid DM modal */}
        {creatorDMProps && (
          <PaidDMModal 
            open={showPaidDM} 
            onClose={() => setShowPaidDM(false)} 
            creatorId={creatorDMProps.creatorId} 
            creatorName={creatorDMProps.creatorName} 
            chatRate={creatorDMProps.creatorChatRate} 
            subscriberId={creatorDMProps.subscriberId} 
            onSessionCreated={sessionId => setActiveSessionId(sessionId)} 
          />
        )}
        
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      <SidebarProvider>
        <div className="flex w-full max-w-[1400px] mx-auto px-4 py-8 gap-6">
          <CreatorSidebar active={activeSection} onSelect={setActiveSection} />
          <main className="flex-1 min-w-0">
            {!activeSessionId && (
              <div className="mb-8 flex items-center gap-4">
                <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
                <Button onClick={handleOpenPaidDM} variant="outline" className="ml-auto">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Test Paid DM
                </Button>
              </div>
            )}
            
            {activeSessionId && (
              <PaidDMChat 
                sessionId={activeSessionId} 
                currentUserId={user.id} 
                onBack={() => setActiveSessionId(null)} 
              />
            )}
            
            {!activeSessionId && activeSection === "overview" && (
              <CreatorDashboard 
                onNavigateToLivestream={handleNavigateToLivestream}
                onNavigateToContent={handleNavigateToContent}
              />
            )}
            {!activeSessionId && activeSection === "livestream" && <LivestreamDashboard />}
            {!activeSessionId && activeSection === "content" && <ContentManagement />}
            {!activeSessionId && activeSection === "settings" && <CreatorSettings />}
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
          chatRate={creatorDMProps.creatorChatRate} 
          subscriberId={creatorDMProps.subscriberId} 
          onSessionCreated={sessionId => setActiveSessionId(sessionId)} 
        />
      )}
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Creator;
