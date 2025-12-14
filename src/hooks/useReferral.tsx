import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Referral {
  id: string;
  referred_id: string;
  referrer_coins_awarded: number;
  referred_coins_awarded: number;
  created_at: string;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  const fetchReferralCode = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setLoading(false);
      return;
    }

    try {
      // Try to get existing code
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setReferralCode(data.code);
      } else {
        // Generate new code
        const { data: newCode } = await supabase.rpc('generate_referral_code');
        
        if (newCode) {
          const { error: insertError } = await supabase
            .from('referral_codes')
            .insert({ user_id: user.id, code: newCode });

          if (!insertError) {
            setReferralCode(newCode);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReferrals(data || []);
      setTotalEarned(data?.reduce((sum, r) => sum + r.referrer_coins_awarded, 0) || 0);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  }, [user]);

  const applyReferralCode = async (code: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('process_referral', {
        p_referral_code: code.toUpperCase(),
        p_referred_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "🎁 Referral Bonus!",
          description: "You received 3 coins for using a referral code!",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error applying referral code:', error);
      return false;
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Share this link with friends to earn coins!",
    });
  };

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
  }, [fetchReferralCode, fetchReferrals]);

  return {
    referralCode,
    referrals,
    totalEarned,
    loading,
    applyReferralCode,
    copyReferralLink,
    refreshReferrals: fetchReferrals
  };
};
