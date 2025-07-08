
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PaidDMChat from "@/components/PaidDMChat";
import PaidDMModal from "@/components/PaidDMModal";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatSession {
  id: string;
  creator_id: string;
  subscriber_id: string;
  created_at: string;
  session_start: string;
  session_end: string | null;
  payment_status: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

const PaidDM = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showPaidDMModal, setShowPaidDMModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChatSessions();
    }
  }, [user]);

  const fetchChatSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          profiles!chat_sessions_creator_id_fkey(display_name, avatar_url)
        `)
        .or(`creator_id.eq.${user.id},subscriber_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setShowPaidDMModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
        <div className={`${isMobile ? 'px-4 py-4 pt-20' : 'ml-64 p-8'} flex items-center justify-center min-h-[calc(100vh-80px)]`}>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign in Required</CardTitle>
              <CardDescription>
                Please sign in to access paid DM features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowAuthModal(true)} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  if (activeSessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
        <div className={`${isMobile ? 'w-full' : 'ml-64'} h-screen`}>
          <PaidDMChat 
            sessionId={activeSessionId} 
            currentUserId={user.id} 
            onBack={() => setActiveSessionId(null)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {!isMobile && <Navbar onAuthClick={() => setShowAuthModal(true)} />}
      
      <div className={`${isMobile ? 'px-4 py-4 pt-20 pb-32' : 'ml-64 p-4 sm:p-6'} max-w-4xl mx-auto`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paid DM</h1>
              <p className="text-gray-600 mt-2">Connect with creators through premium messaging</p>
            </div>
            <Button onClick={handleStartNewChat}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">Loading your conversations...</div>
              </CardContent>
            </Card>
          ) : chatSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start your first paid conversation with a creator
                  </p>
                  <Button onClick={handleStartNewChat}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {chatSessions.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {session.profiles?.display_name?.[0] || 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {session.profiles?.display_name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {session.creator_id === user.id ? 'Subscriber' : 'Creator'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Started: {new Date(session.session_start).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded text-xs ${
                          session.payment_status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.payment_status}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setActiveSessionId(session.id)}
                        >
                          Open Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <PaidDMModal 
        open={showPaidDMModal} 
        onClose={() => setShowPaidDMModal(false)} 
        creatorId="" 
        creatorName="" 
        chatRate={20} 
        subscriberId={user.id} 
        onSessionCreated={(sessionId) => {
          setActiveSessionId(sessionId);
          setShowPaidDMModal(false);
          fetchChatSessions();
        }} 
      />
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default PaidDM;
