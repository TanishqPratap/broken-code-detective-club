
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
      // For DM tips, we'll create a direct payment without using stream infrastructure
      // First, let's create a simple tip record in the database
      const { data: tipData, error: tipError } = await supabase
        .from('tips')
        .insert({
          tipper_id: (await supabase.auth.getUser()).data.user?.id,
          creator_id: recipientId,
          amount: tipAmount,
          message: message.trim() || null
        })
        .select()
        .single();

      if (tipError) throw tipError;

      // For now, we'll simulate a successful payment
      // In a real implementation, you'd integrate with Razorpay here
      console.log('Tip created:', tipData);
      
      onTipSent(tipAmount, message.trim() || undefined);
      onClose();
      setAmount("");
      setMessage("");
      
      toast({
        title: "Tip Sent!",
        description: `Successfully sent $${tipAmount} tip`,
      });
    } catch (error: any) {
      console.error('Error sending tip:', error);
      toast({
        title: "Tip Error",
        description: "Failed to send tip. Please try again.",
        variant: "destructive",
      });
    } finally {
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
