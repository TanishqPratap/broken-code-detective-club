
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PaidDMChat from "@/components/PaidDMChat";
import PaidDMModal from "@/components/PaidDMModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  chat_rate: number | null;
}

interface ChatSessionWithProfile {
  id: string;
  creator_id: string;
  subscriber_id: string;
  hourly_rate: number;
  updated_at: string;
  creator_profile?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
  subscriber_profile?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

const PaidDM = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // For launching new chats, store the selected creator
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  // Featured creators state
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);

  // Load relevant DM sessions (where user is creator or subscriber) with profile data
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select(`
          *,
          creator_profile:profiles!chat_sessions_creator_id_fkey(display_name, username, avatar_url),
          subscriber_profile:profiles!chat_sessions_subscriber_id_fkey(display_name, username, avatar_url)
        `)
        .or(`creator_id.eq.${user.id},subscriber_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      
      setSessions(data || []);
      setLoading(false);
    };

    fetchSessions();
  }, [user, activeSessionId, modalOpen]);

  // Load featured creators
  useEffect(() => {
    // Only fetch if user is signed in since only subscribers can DM creators
    async function fetchCreators() {
      setLoadingCreators(true);
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,chat_rate,role")
        .eq("role", "creator")
        .limit(10);
      setCreators(
        Array.isArray(data)
          ? data.map((c) => ({
              id: c.id,
              display_name: c.display_name ?? c.username,
              username: c.username,
              avatar_url: c.avatar_url,
              chat_rate: typeof c.chat_rate === "number" ? c.chat_rate : c.chat_rate ? Number(c.chat_rate) : null,
            }))
          : []
      );
      setLoadingCreators(false);
    }
    fetchCreators();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your Paid DMs.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // If viewing a specific chat, show full-screen chat
  if (activeSessionId) {
    return (
      <PaidDMChat 
        sessionId={activeSessionId} 
        currentUserId={user.id} 
        onBack={() => setActiveSessionId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <div className="px-4 py-4">
        {/* Instagram-like Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-500" />
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
          <Button 
            onClick={() => { setSelectedCreator(null); setModalOpen(true); }} 
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="space-y-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading conversations...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">Start a paid conversation with your favorite creator</p>
              <Button onClick={() => { setSelectedCreator(null); setModalOpen(true); }}>
                Start New Chat
              </Button>
            </div>
          ) : (
            sessions.map((session) => {
              const isCreator = user.id === session.creator_id;
              const otherProfile = isCreator ? session.subscriber_profile : session.creator_profile;
              const otherDisplayName = otherProfile?.display_name || otherProfile?.username || "Unknown User";
              
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherProfile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {otherDisplayName[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {otherDisplayName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      ${Number(session.hourly_rate).toFixed(2)} per hour
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full opacity-0"></div>
                </div>
              );
            })
          )}
        </div>

        {/* Featured Creators Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Featured Creators</h2>
          {loadingCreators ? (
            <div className="text-center py-4 text-gray-500">Loading creators...</div>
          ) : creators && creators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {creators.slice(0, 6).map((creator) => (
                <Card
                  key={creator.id}
                  className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedCreator(creator);
                    setModalOpen(true);
                  }}
                >
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback>
                      {creator.display_name ? creator.display_name[0] : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm mb-1">
                    {creator.display_name || creator.username}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">@{creator.username}</p>
                  <p className="text-xs text-green-600 font-medium">
                    ${creator.chat_rate ? Number(creator.chat_rate).toFixed(2) : "--"}/hr
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No creators available</div>
          )}
        </div>
      </div>

      {/* DM Create Modal */}
      {modalOpen && (
        <PaidDMModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creatorId={selectedCreator?.id ?? user.id}
          creatorName={selectedCreator?.display_name ?? user.user_metadata?.display_name ?? user.email ?? "Creator"}
          chatRate={
            typeof selectedCreator?.chat_rate === "number"
              ? selectedCreator?.chat_rate
              : typeof user.user_metadata?.chat_rate === "number"
              ? Number(user.user_metadata.chat_rate)
              : user.user_metadata?.chat_rate
              ? Number(user.user_metadata.chat_rate)
              : 20
          }
          subscriberId={user.id}
          onSessionCreated={(sessionId) => {
            setModalOpen(false);
            setActiveSessionId(sessionId);
          }}
        />
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default PaidDM;
