
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StreamPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [streamTitle, setStreamTitle] = useState("");

  const sessionId = searchParams.get('session_id');
  const streamId = searchParams.get('stream_id');

  useEffect(() => {
    if (sessionId && streamId) {
      confirmPayment();
    }
  }, [sessionId, streamId]);

  const confirmPayment = async () => {
    try {
      // Update the subscription status to active
      const { error } = await supabase
        .from('stream_subscriptions')
        .update({ status: 'active' })
        .eq('stream_id', streamId)
        .eq('stripe_payment_intent_id', sessionId);

      if (error) throw error;

      // Get stream details
      const { data: streamData } = await supabase
        .from('live_streams')
        .select('title')
        .eq('id', streamId)
        .single();

      setStreamTitle(streamData?.title || 'Live Stream');

      toast({
        title: "Payment Successful!",
        description: "You now have access to the livestream",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "There was an issue confirming your payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchStream = () => {
    navigate(`/watch/${streamId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for subscribing to "{streamTitle}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              You now have access to watch this livestream. Enjoy the content!
            </p>
            <div className="flex gap-4">
              <Button onClick={handleWatchStream} className="flex-1">
                Watch Stream
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamPaymentSuccess;
