
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface StreamSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  onSubscriptionSuccess: () => void;
}

const StreamSubscriptionModal = ({ isOpen, onClose, streamId, onSubscriptionSuccess }: StreamSubscriptionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingTierId, setProcessingTierId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionTiers();
    }
  }, [isOpen]);

  const fetchSubscriptionTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription options",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async (tierId: string, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setProcessingTierId(tierId);
    setLoading(true);

    try {
      // Create a payment intent for stream subscription
      const { data, error } = await supabase.functions.invoke('create-stream-payment', {
        body: {
          streamId,
          tierId,
          amount: price
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
      setProcessingTierId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscribe to Watch Stream</DialogTitle>
          <DialogDescription>
            Choose a subscription tier to access this livestream
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {tiers.map((tier, index) => (
            <Card key={tier.id} className={`relative ${index === 1 ? 'ring-2 ring-primary' : ''}`}>
              {index === 1 && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-2xl font-bold">
                  ${tier.price}
                  <span className="text-sm font-normal text-muted-foreground">/access</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(tier.id, tier.price)}
                  disabled={loading}
                >
                  {processingTierId === tier.id ? "Processing..." : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreamSubscriptionModal;
