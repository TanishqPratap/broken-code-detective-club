import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Users, Coins } from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { Skeleton } from "@/components/ui/skeleton";

export const ReferralCard = () => {
  const { 
    referralCode, 
    referrals, 
    totalEarned, 
    loading, 
    copyReferralLink 
  } = useReferral();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Refer Friends, Earn Coins
        </CardTitle>
        <CardDescription>
          You get 5 coins, they get 3 coins when they sign up!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="flex gap-2">
          <Input 
            value={referralCode || ''} 
            readOnly 
            className="font-mono text-lg tracking-wider bg-muted"
          />
          <Button onClick={copyReferralLink} variant="secondary">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-xs text-muted-foreground">Friends Referred</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{totalEarned}</p>
              <p className="text-xs text-muted-foreground">Coins Earned</p>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Recent Referrals</p>
            <div className="space-y-2">
              {referrals.slice(0, 3).map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{referral.referrer_coins_awarded} coins
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
