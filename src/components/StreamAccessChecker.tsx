
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, DollarSign, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StreamSubscriptionModal from "./StreamSubscriptionModal";

interface StreamAccessCheckerProps {
  streamId: string;
  children: React.ReactNode;
}

const StreamAccessChecker = ({ streamId, children }: StreamAccessCheckerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamData, setStreamData] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    checkStreamAccess();
  }, [streamId, user]);

  const checkStreamAccess = async () => {
    try {
      setLoading(true);
      
      // Fetch stream details
      const { data: stream, error: streamError } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (streamError) throw streamError;
      setStreamData(stream);

      // If it's a free stream, grant access
      if (!stream.is_paid) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // If it's a paid stream, check subscription
      if (user) {
        const { data: subscription } = await supabase
          .from('stream_subscriptions')
          .select('*')
          .eq('stream_id', streamId)
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        console.log('Subscription check result:', subscription);
        setHasAccess(!!subscription);
      } else {
        setHasAccess(false);
      }
    } catch (error: any) {
      console.error('Error checking stream access:', error);
      toast({
        title: "Error",
        description: "Failed to verify stream access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    setHasAccess(true);
    setShowSubscriptionModal(false);
    // Refresh access check to ensure we have the latest status
    setTimeout(() => {
      checkStreamAccess();
    }, 1000);
    toast({
      title: "Access Granted!",
      description: "You now have access to this paid stream",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  // If user has access or it's a free stream, show the children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show subscription requirement for paid streams
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-8 h-8 text-orange-500" />
            {streamData?.is_paid && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${streamData.price}
              </Badge>
            )}
          </div>
          <CardTitle>{streamData?.title || "Premium Stream"}</CardTitle>
          <CardDescription>
            This is a paid livestream. Subscribe to gain access.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              24-hour access included
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              HD streaming quality
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Instant access after payment
            </div>
          </div>

          <Button 
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full"
            disabled={!user}
            size="lg"
          >
            {user ? `Subscribe for $${streamData?.price}` : "Sign in to Subscribe"}
          </Button>

          {!user && (
            <p className="text-sm text-gray-500">
              Please sign in to subscribe to this stream
            </p>
          )}
        </CardContent>
      </Card>

      <StreamSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        streamId={streamId}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default StreamAccessChecker;
