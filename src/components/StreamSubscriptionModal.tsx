
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

const StreamSubscriptionModal = ({ isOpen, onClose, streamId, onSubscriptionSuccess }: StreamSubscriptionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStreamData();
      loadRazorpayScript();
    }
  }, [isOpen, streamId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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
      // Create a Razorpay order
      const { data, error } = await supabase.functions.invoke('create-stream-payment', {
        body: {
          streamId,
          amount: streamData.price
        }
      });

      if (error) throw error;

      // Store payment info for display
      setPaymentInfo({
        amountUSD: data.amount_usd,
        amountINR: data.amount_inr,
        exchangeRate: data.exchange_rate
      });

      // Initialize Razorpay payment
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "Stream Access",
        description: `Access to ${streamData.title}`,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                streamId
              }
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment Successful!",
              description: "You now have access to the livestream",
            });
            
            onSubscriptionSuccess();
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
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
              {streamData.price} USD
              {paymentInfo && (
                <div className="text-sm font-normal text-muted-foreground ml-2">
                  ≈ ₹{paymentInfo.amountINR.toFixed(2)} INR
                </div>
              )}
              <span className="text-sm font-normal text-muted-foreground">/access</span>
            </div>
            {paymentInfo && (
              <p className="text-xs text-muted-foreground">
                Exchange rate: 1 USD = ₹{paymentInfo.exchangeRate.toFixed(2)} INR
              </p>
            )}
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
              {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)} with Razorpay` : `Pay $${streamData.price} with Razorpay`}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default StreamSubscriptionModal;
