
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, DollarSign, AlertCircle } from "lucide-react";
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
  const [scriptLoading, setScriptLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      // Reset states when modal opens
      setError(null);
      setPaymentInfo(null);
    }
  }, [isOpen]);

  const loadRazorpayScript = async () => {
    if (window.Razorpay) {
      return true;
    }

    setScriptLoading(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptLoading(false);
        resolve(true);
      };
      script.onerror = () => {
        setScriptLoading(false);
        setError('Failed to load payment gateway. Please try again.');
        resolve(false);
      };
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

    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating subscription payment order...');
      
      // Create a subscription payment order
      const { data, error } = await supabase.functions.invoke('create-subscription-payment', {
        body: {
          creatorId,
          amount: subscriptionPrice
        }
      });

      if (error) {
        console.error('Error creating payment order:', error);
        throw new Error(error.message || 'Failed to create payment order');
      }

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
            setLoading(true);
            
            // Verify payment on backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-subscription-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                creatorId
              }
            });

            if (verifyError) {
              console.error('Payment verification error:', verifyError);
              throw new Error(verifyError.message || 'Payment verification failed');
            }

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
            setError(error.message || 'Payment verification failed. Please contact support.');
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Error creating subscription payment:', error);
      setError(error.message || 'Failed to process payment');
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubscribe();
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-700 font-medium">Payment Error</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {scriptLoading ? (
              <Button className="w-full" disabled size="lg">
                Loading payment gateway...
              </Button>
            ) : error ? (
              <Button 
                className="w-full" 
                onClick={handleRetry}
                disabled={loading}
                size="lg"
                variant="outline"
              >
                Retry Payment
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleSubscribe}
                disabled={loading || !user}
                size="lg"
              >
                {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)} with Razorpay` : `Pay $${subscriptionPrice} with Razorpay`}
              </Button>
            )}

            {!user && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Please sign in to subscribe
              </p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaymentModal;
