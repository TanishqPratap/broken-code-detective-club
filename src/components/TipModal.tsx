
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  onTipSent: (amount: number, message?: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TipModal = ({ isOpen, onClose, recipientId, onTipSent }: TipModalProps) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTip = async () => {
    const tipAmount = parseFloat(amount);
    if (!tipAmount || tipAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script if not already loaded
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error("Failed to load Razorpay. Please check your internet connection.");
      }

      // Create payment order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          recipientId: recipientId,
          amount: tipAmount,
          message: message.trim() || undefined
        }
      });

      if (orderError) throw orderError;

      console.log('Payment order created:', orderData);

      // Get current user for payment
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Tip Payment",
        description: `Tip of $${tipAmount}${message.trim() ? ` - ${message.trim()}` : ''}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          console.log('Razorpay payment successful:', response);
          
          try {
            // Verify payment with backend
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-tip-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                recipientId: recipientId,
                amount: tipAmount,
                message: message.trim() || undefined
              }
            });

            if (verificationError) throw verificationError;

            console.log('Payment verified successfully:', verificationData);
            
            // Call the callback to show tip in chat
            onTipSent(tipAmount, message.trim() || undefined);
            
            // Close modal and reset form
            onClose();
            setAmount("");
            setMessage("");
            
            toast({
              title: "Tip Sent!",
              description: `Successfully sent $${tipAmount} tip`,
            });
          } catch (verifyError: any) {
            console.error('Payment verification failed:', verifyError);
            toast({
              title: "Payment Verification Failed",
              description: "Payment was processed but verification failed. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          email: user.email || '',
        },
        theme: {
          color: "#9333ea"
        },
        modal: {
          ondismiss: function() {
            console.log('Razorpay payment cancelled');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Error creating tip payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Send a Tip
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Tip Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="5.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message with your tip..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleTip} className="flex-1" disabled={loading || !amount}>
              {loading ? "Processing..." : `Send $${amount || "0"} Tip`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;
