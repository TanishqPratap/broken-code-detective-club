
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PaidDMChat from "@/components/PaidDMChat";
import PaidDMModal from "@/components/PaidDMModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  chat_rate: number | null;
}

const PaidDM = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // For launching new chats, store the selected creator
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  // Featured creators state
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);

  // Load relevant DM sessions (where user is creator or subscriber)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("chat_sessions")
      .select("*")
      .or(`creator_id.eq.${user.id},subscriber_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setSessions(data || []);
        setLoading(false);
      });
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
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Paid Direct Messages</h1>
        <Button onClick={() => { setSelectedCreator(null); setModalOpen(true); }} className="ml-auto">
          Start New Paid DM
        </Button>
      </div>

      {/* FEATURED CREATORS */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Featured Creators</h2>
        {loadingCreators ? (
          <div className="text-muted-foreground">Loading creators...</div>
        ) : creators && creators.length > 0 ? (
          <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2">
            {creators.map((creator) => (
              <Card
                key={creator.id}
                className="min-w-[220px] px-4 py-3 flex flex-col items-center shadow hover:shadow-lg transition-shadow"
              >
                <Avatar className="w-16 h-16 mb-2">
                  <AvatarImage src={creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {creator.display_name ? creator.display_name[0] : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="font-bold">{creator.display_name || creator.username}</div>
                <div className="text-sm text-muted-foreground">@{creator.username}</div>
                <div className="text-xs mt-1 mb-2 text-muted-foreground">
                  ${creator.chat_rate ? Number(creator.chat_rate).toFixed(2) : "--"} / hour
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCreator(creator);
                    setModalOpen(true);
                  }}
                  disabled={user.id === creator.id}
                  className="w-full"
                >
                  {user.id === creator.id ? "You" : "Start DM"}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No creators found</div>
        )}
      </div>

      {/* SESSION LIST OR CHAT */}
      {activeSessionId ? (
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => setActiveSessionId(null)}>
            &larr; Back to all chats
          </Button>
          <PaidDMChat sessionId={activeSessionId} currentUserId={user.id} />
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div>Loading your Paid DM sessions...</div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Paid DMs yet</CardTitle>
                <CardDescription>
                  You haven't started any Paid DM sessions. Start a new one with your favorite creator!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-4">
                    <span className="font-medium">
                      {user.id === session.creator_id
                        ? "With subscriber"
                        : "With creator"}{" "}
                      <span className="text-purple-600">
                        {user.id === session.creator_id
                          ? session.subscriber_id
                          : session.creator_id}
                      </span>
                      <span className="ml-4 text-xs text-muted-foreground">
                        ${Number(session.hourly_rate).toFixed(2)} per hour
                      </span>
                    </span>
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      Open Chat
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DM Create Modal - starts with selected creator OR self if null */}
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
    </div>
  );
};

export default PaidDM;

