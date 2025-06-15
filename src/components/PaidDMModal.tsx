
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaidDMModalProps {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  chatRate: number;
  subscriberId: string;
  onSessionCreated: (sessionId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaidDMModal = ({
  open,
  onClose,
  creatorId,
  creatorName,
  chatRate,
  subscriberId,
  onSessionCreated
}: PaidDMModalProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRazorpayScript();
      // Pre-fetch exchange rate when modal opens
      fetchPaymentInfo();
    }
  }, [open, chatRate]);

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

  const fetchPaymentInfo = async () => {
    try {
      // Create a payment order to get exchange rate info
      const { data, error } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          recipientId: creatorId,
          amount: chatRate,
          message: `Paid DM session with ${creatorName}`
        }
      });

      if (error) throw error;

      setPaymentInfo({
        amountUSD: data.amount_usd,
        amountINR: data.amount_inr,
        exchangeRate: data.exchange_rate
      });
    } catch (error) {
      console.error('Error fetching payment info:', error);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);

    try {
      // Create a tip payment order (reusing the tip payment function for DM)
      const { data, error } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          recipientId: creatorId,
          amount: chatRate,
          message: `Paid DM session with ${creatorName}`
        }
      });

      if (error) throw error;

      console.log('DM payment order created:', data);

      // Update payment info for display
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
        name: "Paid DM Session",
        description: `1 hour chat session with ${creatorName}`,
        prefill: {
          email: subscriberId,
        },
        theme: {
          color: "#3399cc"
        },
        handler: async function (response: any) {
          try {
            console.log('DM Payment response received:', response);
            
            // Verify payment on backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-tip-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                recipientId: creatorId,
                amount: chatRate,
                message: `Paid DM session with ${creatorName}`
              }
            });

            if (verifyError) throw verifyError;

            console.log('DM Payment verified successfully:', verifyData);

            // Create chat session after successful payment
            const { data: sessionData, error: sessionError } = await supabase
              .from("chat_sessions")
              .insert({
                creator_id: creatorId,
                subscriber_id: subscriberId,
                hourly_rate: chatRate,
                payment_status: "paid",
                stripe_payment_intent_id: response.razorpay_payment_id
              })
              .select()
              .single();

            if (sessionError) throw sessionError;

            toast({
              title: "Payment Successful!",
              description: `You can now chat with ${creatorName}`,
            });
            
            onSessionCreated(sessionData.id);
            onClose();
            
          } catch (error: any) {
            console.error('DM Payment verification failed:', error);
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
      console.error('Error creating DM payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Paid DM with {creatorName}</DialogTitle>
        </DialogHeader>

        <Card className="mt-6">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">1 Hour Chat Session</CardTitle>
            <CardDescription>Direct messaging with {creatorName}</CardDescription>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <DollarSign className="w-6 h-6" />
              {chatRate} USD
              <span className="text-sm font-normal text-muted-foreground">/hour</span>
            </div>
            {paymentInfo && (
              <div className="text-center">
                <div className="text-lg font-semibold text-muted-foreground">
                  ≈ ₹{paymentInfo.amountINR.toFixed(2)} INR
                </div>
                <p className="text-xs text-muted-foreground">
                  Exchange rate: 1 USD = ₹{paymentInfo.exchangeRate.toFixed(2)} INR
                </p>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">1 hour of direct messaging</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Real-time chat interface</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Media sharing supported</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Instant session activation</span>
              </li>
            </ul>
            
            <Button 
              onClick={handleStartSession} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)} with Razorpay` : `Pay $${chatRate} with Razorpay`}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaidDMModal;
