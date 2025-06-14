
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  subscriptionPrice: number;
  onSubscriptionSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionPaymentModal = ({ 
  isOpen, 
  onClose, 
  creatorId, 
  creatorName, 
  subscriptionPrice, 
  onSubscriptionSuccess 
}: SubscriptionPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    }
  }, [isOpen]);

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

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create a subscription payment order
      const { data, error } = await supabase.functions.invoke('create-subscription-payment', {
        body: {
          creatorId,
          amount: subscriptionPrice
        }
      });

      if (error) throw error;

      console.log('Subscription payment order created:', data);

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
        name: "Creator Subscription",
        description: `Monthly subscription to ${creatorName}`,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        },
        handler: async function (response: any) {
          try {
            console.log('Payment response received:', response);
            
            // Verify payment on backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-subscription-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                creatorId
              }
            });

            if (verifyError) throw verifyError;

            console.log('Subscription payment verified successfully:', verifyData);

            toast({
              title: "Subscription Successful!",
              description: `You are now subscribed to ${creatorName}`,
            });
            
            // Close modal and trigger success callback
            onClose();
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
      console.error('Error creating subscription payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {creatorName}</DialogTitle>
          <DialogDescription>
            Get access to exclusive content and support your favorite creator
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-6">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Monthly Subscription</CardTitle>
            <CardDescription>Full access to {creatorName}'s content</CardDescription>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <DollarSign className="w-6 h-6" />
              {subscriptionPrice} USD
              {paymentInfo && (
                <div className="text-sm font-normal text-muted-foreground ml-2">
                  ≈ ₹{paymentInfo.amountINR.toFixed(2)} INR
                </div>
              )}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
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
                <span className="text-sm">Access to all premium content</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Exclusive posts and media</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Direct messaging privileges</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Monthly subscription renewal</span>
              </li>
            </ul>
            
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
            >
              {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)} with Razorpay` : `Pay $${subscriptionPrice} with Razorpay`}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaymentModal;
