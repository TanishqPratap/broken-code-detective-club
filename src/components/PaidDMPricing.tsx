
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Save, Loader2 } from "lucide-react";

const PaidDMPricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRate, setChatRate] = useState("");
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
        .select('chat_rate')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching chat rate:', error);
        return;
      }

      setChatRate(data.chat_rate?.toString() || "");
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const rate = parseFloat(chatRate);
    if (isNaN(rate) || rate < 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid hourly rate (minimum $0.00)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          chat_rate: rate,
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
        description: `Your Paid DM hourly rate is now $${rate.toFixed(2)}`,
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
            <DollarSign className="w-5 h-5" />
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
          <DollarSign className="w-5 h-5" />
          Paid DM Pricing
        </CardTitle>
        <CardDescription>
          Set your hourly rate for private direct messages. Subscribers will pay this rate to chat with you directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chat-rate">Hourly Rate (USD)</Label>
          <div className="flex gap-2">
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                $
              </span>
              <Input
                id="chat-rate"
                type="number"
                step="0.01"
                min="0"
                value={chatRate}
                onChange={(e) => setChatRate(e.target.value)}
                placeholder="25.00"
                className="rounded-l-none"
                disabled={saving}
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !chatRate}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Rate"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {chatRate && !isNaN(parseFloat(chatRate)) ? (
              <>Subscribers will pay ${parseFloat(chatRate).toFixed(2)} per hour to chat with you</>
            ) : (
              "Enter your desired hourly rate for paid direct messages"
            )}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Paid DMs Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Subscribers pay your hourly rate upfront to start a conversation</li>
            <li>• Payment is processed securely through our platform</li>
            <li>• You earn money for each hour of conversation time</li>
            <li>• Set a competitive rate that reflects your time and expertise</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaidDMPricing;
