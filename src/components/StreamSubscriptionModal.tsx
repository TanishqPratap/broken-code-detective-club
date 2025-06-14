
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StreamSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  onSubscriptionSuccess: () => void;
}

const StreamSubscriptionModal = ({ isOpen, onClose, streamId, onSubscriptionSuccess }: StreamSubscriptionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStreamData();
    }
  }, [isOpen, streamId]);

  const fetchStreamData = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      setStreamData(data);
    } catch (error) {
      console.error('Error fetching stream data:', error);
      toast({
        title: "Error",
        description: "Failed to load stream information",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    if (!streamData?.price) {
      toast({
        title: "Error",
        description: "Stream price not available",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create a payment intent for stream subscription
      const { data, error } = await supabase.functions.invoke('create-stream-payment', {
        body: {
          streamId,
          amount: streamData.price
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!streamData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading stream information...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to Watch Stream</DialogTitle>
          <DialogDescription>
            Get access to this livestream
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-6">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{streamData.title}</CardTitle>
            <CardDescription>{streamData.description || "Premium livestream access"}</CardDescription>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <DollarSign className="w-6 h-6" />
              {streamData.price}
              <span className="text-sm font-normal text-muted-foreground">/access</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">24-hour stream access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">HD streaming quality</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Chat participation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Instant access after payment</span>
              </li>
            </ul>
            
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
            >
              {loading ? "Processing..." : `Subscribe for $${streamData.price}`}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default StreamSubscriptionModal;
