
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

interface PaidDMModalProps {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  chatRateCoins: number;
  subscriberId: string;
  onSessionCreated: (sessionId: string) => void;
}

const PaidDMModal = ({
  open,
  onClose,
  creatorId,
  creatorName,
  chatRateCoins,
  subscriberId,
  onSessionCreated
}: PaidDMModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { balance, transferCoins, refreshWallet } = useWallet();

  const hasEnoughCoins = balance >= chatRateCoins;

  const handlePayWithCoins = async () => {
    if (!hasEnoughCoins) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${chatRateCoins} coins but only have ${balance}. Please purchase more coins.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Transfer coins from subscriber to creator
      const success = await transferCoins(
        creatorId,
        chatRateCoins,
        `Paid DM session with ${creatorName}`
      );

      if (!success) {
        throw new Error("Failed to transfer coins");
      }

      // Create chat session after successful payment
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          creator_id: creatorId,
          subscriber_id: subscriberId,
          hourly_rate: chatRateCoins,
          payment_status: "paid",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      await refreshWallet();

      toast({
        title: "Payment Successful!",
        description: `You paid ${chatRateCoins} coins. You can now chat with ${creatorName}`,
      });
      
      onSessionCreated(sessionData.id);
      onClose();
      
    } catch (error: any) {
      console.error('DM Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
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
              <Coins className="w-6 h-6" />
              {chatRateCoins} Coins
              <span className="text-sm font-normal text-muted-foreground">/hour</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Your balance: <span className={hasEnoughCoins ? "text-green-600" : "text-destructive"}>{balance} coins</span>
            </div>
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
              onClick={handlePayWithCoins} 
              disabled={loading || !hasEnoughCoins}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Pay {chatRateCoins} Coins
                </>
              )}
            </Button>
            
            {!hasEnoughCoins && (
              <p className="text-sm text-destructive text-center mt-2">
                You need {chatRateCoins - balance} more coins to start this chat
              </p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaidDMModal;
