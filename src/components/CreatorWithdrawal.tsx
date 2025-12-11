import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Coins, Wallet, ArrowDownToLine, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface WithdrawalRequest {
  id: string;
  coins_amount: number;
  usd_amount: number;
  payment_method: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

// Conversion rate: approximately $10 per coin (based on 5 coins = $50)
const COIN_TO_USD_RATE = 10;
const PLATFORM_FEE_PERCENT = 2;

const CreatorWithdrawal = () => {
  const { user } = useAuth();
  const { balance, refreshWallet } = useWallet();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [withdrawalForm, setWithdrawalForm] = useState({
    coins: '',
    method: 'upi',
    details: ''
  });

  useEffect(() => {
    if (user) {
      fetchWithdrawalRequests();
    }
  }, [user]);

  const fetchWithdrawalRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!user) return;

    const coinsToWithdraw = parseInt(withdrawalForm.coins);
    
    if (!coinsToWithdraw || coinsToWithdraw <= 0) {
      toast.error("Please enter a valid number of coins");
      return;
    }

    if (coinsToWithdraw > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!withdrawalForm.details.trim()) {
      toast.error("Please enter your payment details");
      return;
    }

    const usdAmount = coinsToWithdraw * COIN_TO_USD_RATE * (1 - PLATFORM_FEE_PERCENT / 100);

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          creator_id: user.id,
          coins_amount: coinsToWithdraw,
          usd_amount: usdAmount,
          payment_method: withdrawalForm.method,
          payment_details: {
            method: withdrawalForm.method,
            details: withdrawalForm.details.trim()
          },
          status: 'pending'
        });

      if (error) throw error;

      // Deduct coins from wallet
      const { error: spendError } = await supabase.rpc('spend_coins', {
        p_user_id: user.id,
        p_amount: coinsToWithdraw,
        p_description: 'Withdrawal request'
      });

      if (spendError) throw spendError;

      toast.success("Withdrawal request submitted successfully!");
      setWithdrawalForm({ coins: '', method: 'upi', details: '' });
      await fetchWithdrawalRequests();
      await refreshWallet();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const estimatedUsd = withdrawalForm.coins 
    ? (parseInt(withdrawalForm.coins) * COIN_TO_USD_RATE * (1 - PLATFORM_FEE_PERCENT / 100)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available to Withdraw</p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-6 h-6 text-yellow-500" />
                <span className="text-3xl font-bold text-green-700 dark:text-green-400">{balance}</span>
                <span className="text-muted-foreground">Coins</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ ${(balance * COIN_TO_USD_RATE).toFixed(2)} USD (before fees)
              </p>
            </div>
            <Wallet className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Withdraw your earned coins to real money. A {PLATFORM_FEE_PERCENT}% platform fee applies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coins">Coins to Withdraw</Label>
              <Input
                id="coins"
                type="number"
                min="1"
                max={balance}
                value={withdrawalForm.coins}
                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, coins: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>You'll Receive</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                <span className="text-lg font-semibold text-green-600">${estimatedUsd}</span>
                <span className="text-sm text-muted-foreground ml-2">USD</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={withdrawalForm.method}
              onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="details">
              {withdrawalForm.method === 'upi' && 'UPI ID'}
              {withdrawalForm.method === 'bank' && 'Bank Account Details'}
              {withdrawalForm.method === 'paypal' && 'PayPal Email'}
            </Label>
            <Textarea
              id="details"
              value={withdrawalForm.details}
              onChange={(e) => setWithdrawalForm(prev => ({ ...prev, details: e.target.value }))}
              placeholder={
                withdrawalForm.method === 'upi' ? 'yourname@upi' :
                withdrawalForm.method === 'bank' ? 'Account Number, IFSC Code, Bank Name' :
                'your-email@example.com'
              }
              rows={2}
            />
          </div>

          <Button 
            onClick={handleSubmitWithdrawal} 
            disabled={submitting || !withdrawalForm.coins || !withdrawalForm.details}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No withdrawal requests yet</div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {requests.map((request) => (
                  <Card key={request.id} className="border-l-4" style={{
                    borderLeftColor: 
                      request.status === 'completed' ? '#22c55e' :
                      request.status === 'rejected' ? '#ef4444' :
                      request.status === 'approved' ? '#3b82f6' : '#eab308'
                  }}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{request.coins_amount} Coins</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-green-600 font-semibold">${request.usd_amount.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')} • {request.payment_method.toUpperCase()}
                          </p>
                          {request.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {request.admin_notes}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorWithdrawal;
