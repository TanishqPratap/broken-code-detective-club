
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

  const paymentId = searchParams.get('payment_id');
  const streamId = searchParams.get('stream_id');

  useEffect(() => {
    if (paymentId && streamId) {
      confirmPayment();
    } else {
      // If we don't have the required parameters, just show success
      setLoading(false);
    }
  }, [paymentId, streamId]);

  const confirmPayment = async () => {
    try {
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
      console.error('Error fetching stream details:', error);
      toast({
        title: "Error",
        description: "There was an issue loading stream details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchStream = () => {
    if (streamId) {
      navigate(`/watch/${streamId}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
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
              {streamTitle ? `Thank you for subscribing to "${streamTitle}"` : "Thank you for your payment"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              You now have access to watch this livestream. Enjoy the content!
            </p>
            <div className="flex gap-4">
              <Button onClick={handleWatchStream} className="flex-1">
                {streamId ? "Watch Stream" : "Go to Streams"}
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
