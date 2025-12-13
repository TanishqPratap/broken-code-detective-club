import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, History, AlertCircle, CheckCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CoinPackage {
  id: string;
  coins: number;
  price_usd: number;
  gumroad_link: string;
}

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { balance, packages, transactions, loading } = useWallet();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleSelectPackage = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setEmailConfirmation("");
    setShowEmailVerification(true);
  };

  const handleConfirmPurchase = () => {
    if (!user?.email || !user?.id) {
      toast.error("You must be logged in to purchase coins");
      return;
    }

    if (emailConfirmation.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      toast.error("Email doesn't match your account email. Please use the same email for Gumroad purchase.");
      return;
    }

    if (selectedPackage) {
      // Append email and user_id to Gumroad link for verification
      const gumroadUrl = new URL(selectedPackage.gumroad_link);
      gumroadUrl.searchParams.set('email', user.email);
      gumroadUrl.searchParams.set('user_id', user.id);
      window.open(gumroadUrl.toString(), '_blank');
      
      toast.success("Redirecting to Gumroad. Complete your purchase to receive coins automatically!");
      setShowEmailVerification(false);
      setSelectedPackage(null);
      setEmailConfirmation("");
    }
  };

  const handleCancelVerification = () => {
    setShowEmailVerification(false);
    setSelectedPackage(null);
    setEmailConfirmation("");
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="default" className="bg-green-500">Purchase</Badge>;
      case 'earn':
        return <Badge variant="default" className="bg-blue-500">Earned</Badge>;
      case 'spend':
        return <Badge variant="secondary">Spent</Badge>;
      case 'withdrawal':
        return <Badge variant="outline">Withdrawal</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            My Wallet
          </DialogTitle>
        </DialogHeader>

        {/* Balance Display */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-8 h-8 text-yellow-500" />
                <span className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">
                  {loading ? "..." : balance}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Coins</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Buy Coins
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="mt-4">
            {showEmailVerification && selectedPackage ? (
              <Card className="border-yellow-400">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Verify Your Email</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    To receive your coins, you must use the <strong>same email</strong> on Gumroad as your account email. Please confirm your email below:
                  </p>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Purchasing:</span>{" "}
                      <strong>{selectedPackage.coins} Coins</strong> for <strong>${selectedPackage.price_usd}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-confirm">Enter your account email to confirm</Label>
                    <Input
                      id="email-confirm"
                      type="email"
                      placeholder="your@email.com"
                      value={emailConfirmation}
                      onChange={(e) => setEmailConfirmation(e.target.value)}
                    />
                    {emailConfirmation && user?.email && emailConfirmation.toLowerCase().trim() === user.email.toLowerCase().trim() && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Email matches!
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelVerification} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirmPurchase} 
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                      disabled={!emailConfirmation}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Continue to Gumroad
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {packages.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No coin packages available at the moment.
                    </CardContent>
                  </Card>
                ) : (
                  packages.map((pkg) => (
                    <Card 
                      key={pkg.id} 
                      className="hover:border-yellow-400 transition-colors cursor-pointer"
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                              <Coins className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">{pkg.coins} Coins</p>
                              <p className="text-sm text-muted-foreground">
                                ${(pkg.price_usd / pkg.coins).toFixed(2)} per coin
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-green-600">${pkg.price_usd}</p>
                            <Button size="sm" variant="outline" className="mt-1">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Buy
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Purchases are processed securely via Gumroad. Use your account email to automatically receive coins.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[300px]">
              {transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <Card key={tx.id} className="border-l-4" style={{
                      borderLeftColor: tx.amount > 0 ? '#22c55e' : '#ef4444'
                    }}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(tx.transaction_type, tx.amount)}
                            <div>
                              <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </p>
                            {getTransactionBadge(tx.transaction_type)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
