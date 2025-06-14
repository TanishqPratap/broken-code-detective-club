
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Heart, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StreamTippingProps {
  streamId: string;
  creatorId: string;
}

interface Tip {
  id: string;
  amount: number;
  message: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
  } | null;
}

const StreamTipping = ({ streamId, creatorId }: StreamTippingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentTips, setRecentTips] = useState<Tip[]>([]);
  const [totalTips, setTotalTips] = useState(0);

  const suggestedAmounts = [1, 5, 10, 25, 50];

  useEffect(() => {
    fetchRecentTips();
    const cleanup = subscribeToTips();
    return cleanup;
  }, [streamId]);

  const fetchRecentTips = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_tips')
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTips(data || []);

      // Calculate total tips
      const { data: totalData, error: totalError } = await supabase
        .from('stream_tips')
        .select('amount')
        .eq('stream_id', streamId);

      if (!totalError && totalData) {
        const total = totalData.reduce((sum, tip) => sum + parseFloat(tip.amount.toString()), 0);
        setTotalTips(total);
      }
    } catch (error: any) {
      console.error('Error fetching tips:', error);
    }
  };

  const subscribeToTips = () => {
    const channel = supabase
      .channel(`stream-tips-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_tips',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          // Fetch the complete tip with profile data
          const { data } = await supabase
            .from('stream_tips')
            .select(`
              *,
              profiles (
                username,
                display_name
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setRecentTips(prev => [data, ...prev.slice(0, 4)]);
            setTotalTips(prev => prev + parseFloat(data.amount.toString()));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send tips",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(tipAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stream_tips')
        .insert({
          stream_id: streamId,
          tipper_id: user.id,
          amount: amount,
          message: tipMessage.trim() || null
        });

      if (error) throw error;
      
      setTipAmount("");
      setTipMessage("");
      toast({
        title: "Tip sent!",
        description: `You sent $${amount} to the creator`,
      });
    } catch (error: any) {
      console.error('Error sending tip:', error);
      toast({
        title: "Error",
        description: "Failed to send tip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Support Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Tips Display */}
        <div className="text-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">${totalTips.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-600">Total tips received</p>
        </div>

        {/* Tip Form */}
        {user && (
          <form onSubmit={handleSendTip} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Tip Amount ($)</label>
              <div className="flex gap-2 mb-2">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount.toString())}
                    className="flex-1"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Custom amount"
                min="0.01"
                step="0.01"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Message (optional)</label>
              <Textarea
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                placeholder="Say something nice..."
                rows={2}
                maxLength={200}
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !tipAmount || parseFloat(tipAmount) <= 0}
            >
              <Gift className="w-4 h-4 mr-2" />
              Send Tip
            </Button>
          </form>
        )}

        {!user && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Sign in to send tips to the creator</p>
          </div>
        )}

        {/* Recent Tips */}
        {recentTips.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Tips</h4>
            <div className="space-y-2">
              {recentTips.map((tip) => (
                <div key={tip.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {tip.profiles?.display_name || tip.profiles?.username || 'Anonymous'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      ${tip.amount}
                    </Badge>
                  </div>
                  {tip.message && (
                    <p className="text-gray-600 break-words">{tip.message}</p>
                  )}
                  <p className="text-gray-400 mt-1">{formatTime(tip.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamTipping;
