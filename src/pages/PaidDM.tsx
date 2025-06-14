
// Paid DM Hub Page: Shows a list of DM sessions and lets users start new Paid DMs
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PaidDMChat from "@/components/PaidDMChat";
import PaidDMModal from "@/components/PaidDMModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const PaidDM = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // For launching new chats, store the current user's id/name/price (would be available in real discover/creator pick)
  const [creator, setCreator] = useState<any | null>(null);

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
        <Button onClick={() => setModalOpen(true)} className="ml-auto">
          Start New Paid DM
        </Button>
      </div>
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

      {/* DM Create Modal - Very demo (just talks to yourself) */}
      {modalOpen && (
        <PaidDMModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creatorId={user.id}
          creatorName={user.user_metadata?.display_name || user.email || "Creator"}
          chatRate={
            typeof user.user_metadata?.chat_rate === "number"
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
