
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
      // Create tip payment order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          streamId: 'dm-tip', // Using a generic ID for DM tips
          amount: tipAmount,
          message: message.trim() || null
        }
      });

      if (orderError) throw orderError;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Direct Message Tip",
        description: `Tip of $${tipAmount}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-tip-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                streamId: 'dm-tip',
                amount: tipAmount,
                message: message.trim() || null
              }
            });

            if (verifyError) throw verifyError;

            onTipSent(tipAmount, message.trim() || undefined);
            onClose();
            setAmount("");
            setMessage("");
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "There was an issue verifying your payment. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: "Anonymous Tipper",
        },
        theme: {
          color: "#7c3aed"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Error creating tip payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
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
