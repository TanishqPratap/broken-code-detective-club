
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const { toast } = useToast();

  const handleStartSession = async () => {
    setLoading(true);
    // Demo: skip payment handling, mark as "paid"
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        creator_id: creatorId,
        subscriber_id: subscriberId,
        hourly_rate: chatRate,
        payment_status: "paid"
      })
      .select()
      .maybeSingle();

    setLoading(false);
    if (error || !data) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to create chat session",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Paid DM started!",
      description: `You can now chat with ${creatorName}`
    });
    onSessionCreated(data.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Paid DM with {creatorName}</DialogTitle>
        </DialogHeader>
        <div>
          <p className="mb-2">
            Price: <b>${chatRate.toFixed(2)}</b> per hour (charged up front)
          </p>
          <p className="mb-4 text-muted-foreground text-sm">
            By starting this chat, you'll pay to message {creatorName} directly.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="ghost" disabled={loading}>Cancel</Button>
          <Button onClick={handleStartSession} disabled={loading}>
            {loading ? "Starting..." : "Start Paid DM"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaidDMModal;
