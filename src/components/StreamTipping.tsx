import React, { useState, useEffect } from "react";
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
  username?: string;
  display_name?: string;
}

// Declare Razorpay global variable
declare global {
  interface Window {
    Razorpay: any;
  }
}

const StreamTipping = ({ streamId, creatorId }: StreamTippingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentTips, setRecentTips] = useState<Tip[]>([]);
  const [totalTips, setTotalTips] = useState(0);
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);

  const suggestedAmounts = [1, 5, 10, 25, 50];

  useEffect(() => {
    // Load Razorpay script
    loadRazorpayScript();
    fetchRecentTips();
    const cleanup = subscribeToTips();
    return cleanup;
  }, [streamId]);

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

  const fetchRecentTips = async () => {
    try {
      // Get recent tips
      const { data: tipsData, error: tipsError } = await supabase
        .from('stream_tips')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (tipsError) throw tipsError;

      if (tipsData && tipsData.length > 0) {
        // Get user profiles for the tips
        const userIds = [...new Set(tipsData.map(tip => tip.tipper_id))];
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .in('id', userIds);

          // Merge tips with profile data
          const tipsWithProfiles = tipsData.map(tip => {
            const profile = profilesData?.find(p => p.id === tip.tipper_id);
            return {
              ...tip,
              username: profile?.username,
              display_name: profile?.display_name
            };
          });

          setRecentTips(tipsWithProfiles);
        } else {
          setRecentTips(tipsData);
        }
      } else {
        setRecentTips([]);
      }

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
      .channel(`stream-tips-${streamId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_tips',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          // Fetch the user profile for the new tip
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', payload.new.tipper_id)
            .single();

          const newTip = {
            ...payload.new,
            username: profile?.username,
            display_name: profile?.display_name
          } as Tip;

          setRecentTips(prev => [newTip, ...prev.slice(0, 4)]);
          setTotalTips(prev => prev + parseFloat(newTip.amount.toString()));
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
      // Load Razorpay script if not already loaded
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error("Failed to load Razorpay. Please check your internet connection.");
      }

      // Create payment order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          streamId,
          amount,
          message: tipMessage.trim() || null
        }
      });

      if (orderError) throw orderError;

      console.log('Stream tip payment order created:', orderData);

      // Store payment info for display
      setPaymentInfo({
        amountUSD: orderData.amount_usd,
        amountINR: orderData.amount_inr,
        exchangeRate: orderData.exchange_rate
      });

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Stream Tip",
        description: `Tip of $${amount}${tipMessage.trim() ? ` - ${tipMessage.trim()}` : ''}`,
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
                streamId,
                amount,
                message: tipMessage.trim() || null
              }
            });

            if (verificationError) throw verificationError;

            console.log('Stream tip payment verified successfully:', verificationData);
            
            setTipAmount("");
            setTipMessage("");
            setPaymentInfo(null);
            toast({
              title: "Tip Sent!",
              description: `Successfully sent $${amount} tip (₹${paymentInfo?.amountINR.toFixed(2)} INR)`,
            });
            
          } catch (verifyError: any) {
            console.error('Payment verification failed:', verifyError);
            toast({
              title: "Payment Verification Failed",
              description: "Payment was processed but verification failed. Please contact support.",
              variant: "destructive",
            });
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
            setPaymentInfo(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Error creating stream tip payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      setPaymentInfo(null);
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
              {paymentInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ ₹{paymentInfo.amountINR.toFixed(2)} INR (Rate: {paymentInfo.exchangeRate.toFixed(2)})
                </p>
              )}
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
              {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)}` : `Send $${tipAmount || "0"} Tip`}
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
                      {tip.display_name || tip.username || 'Anonymous'}
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
