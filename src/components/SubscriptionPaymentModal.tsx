import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, DollarSign, AlertCircle, Coins, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  subscriptionPrice: number;
  subscriptionPriceCoins?: number;
  onSubscriptionSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionPaymentModal = ({ 
  isOpen, 
  onClose, 
  creatorId, 
  creatorName, 
  subscriptionPrice,
  subscriptionPriceCoins,
  onSubscriptionSuccess 
}: SubscriptionPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { balance, transferCoins, refreshWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'razorpay'>('coins');
  const [paymentInfo, setPaymentInfo] = useState<{
    amountUSD: number;
    amountINR: number;
    exchangeRate: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatorCoinPrice, setCreatorCoinPrice] = useState<number | null>(subscriptionPriceCoins || null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      fetchCreatorCoinPrice();
      setError(null);
      setPaymentInfo(null);
    }
  }, [isOpen, creatorId, subscriptionPriceCoins]);

  const fetchCreatorCoinPrice = async () => {
    try {
      const { data } = await supabase
        .from('creator_directory')
        .select('subscription_price_coins')
        .eq('id', creatorId)
        .maybeSingle();

      if (data?.subscription_price_coins) {
        setCreatorCoinPrice(data.subscription_price_coins);
      }
    } catch (err) {
      console.error('Error fetching creator coin price:', err);
    }
  };

  const loadRazorpayScript = async () => {
    if (window.Razorpay) {
      return true;
    }

    setScriptLoading(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptLoading(false);
        resolve(true);
      };
      script.onerror = () => {
        setScriptLoading(false);
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCoinSubscription = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    if (!creatorCoinPrice) {
      toast({
        title: "Not Available",
        description: "This creator hasn't set a coin price for subscriptions",
        variant: "destructive",
      });
      return;
    }

    if (balance < creatorCoinPrice) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${creatorCoinPrice} coins but only have ${balance}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transfer coins to creator
      const success = await transferCoins(
        creatorId,
        creatorCoinPrice,
        `Subscription to ${creatorName}`,
        creatorId
      );

      if (!success) {
        throw new Error('Failed to transfer coins');
      }

      // Create subscription record
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          creator_id: creatorId,
          subscriber_id: user.id,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString()
        });

      if (subError) {
        console.error('Subscription creation error:', subError);
        throw new Error('Failed to create subscription');
      }

      await refreshWallet();

      toast({
        title: "Subscription Successful!",
        description: `You are now subscribed to ${creatorName} using ${creatorCoinPrice} coins`,
      });

      onClose();
      onSubscriptionSuccess();

    } catch (error: any) {
      console.error('Coin subscription error:', error);
      setError(error.message || 'Failed to process coin subscription');
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpaySubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating subscription payment order...');
      
      const { data, error } = await supabase.functions.invoke('create-subscription-payment', {
        body: {
          creatorId,
          amount: subscriptionPrice
        }
      });

      if (error) {
        console.error('Error creating payment order:', error);
        throw new Error(error.message || 'Failed to create payment order');
      }

      console.log('Subscription payment order created:', data);

      setPaymentInfo({
        amountUSD: data.amount_usd,
        amountINR: data.amount_inr,
        exchangeRate: data.exchange_rate
      });

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "Creator Subscription",
        description: `Monthly subscription to ${creatorName}`,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        },
        handler: async function (response: any) {
          try {
            console.log('Payment response received:', response);
            setLoading(true);
            
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-subscription-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                creatorId
              }
            });

            if (verifyError) {
              console.error('Payment verification error:', verifyError);
              throw new Error(verifyError.message || 'Payment verification failed');
            }

            console.log('Subscription payment verified successfully:', verifyData);

            toast({
              title: "Subscription Successful!",
              description: `You are now subscribed to ${creatorName}`,
            });
            
            onClose();
            onSubscriptionSuccess();
            
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            setError(error.message || 'Payment verification failed. Please contact support.');
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Error creating subscription payment:', error);
      setError(error.message || 'Failed to process payment');
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (paymentMethod === 'coins') {
      handleCoinSubscription();
    } else {
      handleRazorpaySubscribe();
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubscribe();
  };

  const canPayWithCoins = creatorCoinPrice !== null && creatorCoinPrice > 0;
  const hasEnoughCoins = canPayWithCoins && balance >= (creatorCoinPrice || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {creatorName}</DialogTitle>
          <DialogDescription>
            Get access to exclusive content and support your favorite creator
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-4">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Monthly Subscription</CardTitle>
            <CardDescription>Full access to {creatorName}'s content</CardDescription>
            
            {/* Price Display */}
            <div className="flex flex-col gap-2 mt-4">
              {canPayWithCoins && (
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-primary">
                  <Coins className="w-5 h-5" />
                  {creatorCoinPrice} Coins
                </div>
              )}
              {subscriptionPrice > 0 && (
                <div className="text-lg text-muted-foreground flex items-center justify-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {subscriptionPrice} USD
                  <span className="text-sm font-normal">/month</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Payment Method Selection */}
            {canPayWithCoins && subscriptionPrice > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'coins' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('coins')}
                    className="flex items-center gap-2"
                  >
                    <Coins className="w-4 h-4" />
                    Pay with Coins
                  </Button>
                  <Button
                    variant={paymentMethod === 'razorpay' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('razorpay')}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Pay with Card
                  </Button>
                </div>
              </div>
            )}

            {/* Coin Balance Display */}
            {paymentMethod === 'coins' && canPayWithCoins && (
              <div className={`mb-4 p-3 rounded-lg ${hasEnoughCoins ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">Your Balance</span>
                  </div>
                  <span className={`font-bold ${hasEnoughCoins ? 'text-green-600' : 'text-red-600'}`}>
                    {balance} Coins
                  </span>
                </div>
                {!hasEnoughCoins && (
                  <p className="text-xs text-red-600 mt-1">
                    You need {(creatorCoinPrice || 0) - balance} more coins
                  </p>
                )}
              </div>
            )}

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Access to all premium content</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Exclusive posts and media</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Direct messaging privileges</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Monthly subscription renewal</span>
              </li>
            </ul>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-700 font-medium">Payment Error</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'coins' && canPayWithCoins ? (
              <Button 
                className="w-full" 
                onClick={handleSubscribe}
                disabled={loading || !user || !hasEnoughCoins}
                size="lg"
              >
                {loading ? "Processing..." : `Pay ${creatorCoinPrice} Coins`}
              </Button>
            ) : scriptLoading ? (
              <Button className="w-full" disabled size="lg">
                Loading payment gateway...
              </Button>
            ) : error ? (
              <Button 
                className="w-full" 
                onClick={handleRetry}
                disabled={loading}
                size="lg"
                variant="outline"
              >
                Retry Payment
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleSubscribe}
                disabled={loading || !user}
                size="lg"
              >
                {loading ? "Processing..." : paymentInfo ? `Pay ₹${paymentInfo.amountINR.toFixed(2)} with Razorpay` : `Pay $${subscriptionPrice} with Razorpay`}
              </Button>
            )}

            {!user && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Please sign in to subscribe
              </p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaymentModal;