
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Coins, Save, Loader2 } from "lucide-react";

const PaidDMPricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRateCoins, setChatRateCoins] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCurrentRate();
    }
  }, [user]);

  const fetchCurrentRate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('chat_rate_coins')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching chat rate:', error);
        return;
      }

      setChatRateCoins(data.chat_rate_coins?.toString() || "");
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const rate = parseInt(chatRateCoins);
    if (isNaN(rate) || rate < 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid hourly rate in coins (minimum 0)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          chat_rate_coins: rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating chat rate:', error);
        toast({
          title: "Error",
          description: "Failed to update your hourly rate. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rate Updated!",
        description: `Your Paid DM hourly rate is now ${rate} coins`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Paid DM Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading pricing...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Paid DM Pricing
        </CardTitle>
        <CardDescription>
          Set your hourly rate in coins for private direct messages. Subscribers will pay this rate to chat with you directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chat-rate">Hourly Rate (Coins)</Label>
          <div className="flex gap-2">
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm bg-muted border border-r-0 border-input rounded-l-md">
                <Coins className="w-4 h-4" />
              </span>
              <Input
                id="chat-rate"
                type="number"
                step="1"
                min="0"
                value={chatRateCoins}
                onChange={(e) => setChatRateCoins(e.target.value)}
                placeholder="50"
                className="rounded-l-none"
                disabled={saving}
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !chatRateCoins}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Rate"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {chatRateCoins && !isNaN(parseInt(chatRateCoins)) ? (
              <>Subscribers will pay {parseInt(chatRateCoins)} coins per hour to chat with you</>
            ) : (
              "Enter your desired hourly rate in coins for paid direct messages"
            )}
          </p>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How Paid DMs Work</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Subscribers pay your hourly rate in coins upfront to start a conversation</li>
            <li>• Payment is processed securely through our coin system</li>
            <li>• You earn coins for each hour of conversation time</li>
            <li>• Set a competitive rate that reflects your time and expertise</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaidDMPricing;
