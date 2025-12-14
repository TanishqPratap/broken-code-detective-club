import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CoinPackage {
  id: string;
  coins: number;
  price_usd: number;
  gumroad_link: string;
}

interface CoinTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);

  const checkDailyReward = useCallback(async (walletData: { last_daily_reward: string | null }) => {
    if (!user) return;

    const lastReward = walletData.last_daily_reward ? new Date(walletData.last_daily_reward) : null;
    const now = new Date();
    
    // Check if last reward was on a different day (or never claimed)
    const shouldClaimDaily = !lastReward || 
      lastReward.toDateString() !== now.toDateString();

    if (shouldClaimDaily) {
      try {
        // Update wallet with daily reward
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ 
            balance: supabase.rpc ? undefined : undefined, // Will use RPC instead
            last_daily_reward: now.toISOString()
          })
          .eq('user_id', user.id);

        // Use RPC to add coins safely
        const { error: rpcError } = await supabase.rpc('add_coins', {
          p_user_id: user.id,
          p_amount: 2,
          p_transaction_type: 'daily_reward',
          p_description: 'Daily login reward - 2 coins'
        });

        if (!rpcError && !updateError) {
          // Update the last_daily_reward timestamp
          await supabase
            .from('wallets')
            .update({ last_daily_reward: now.toISOString() })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error claiming daily reward:', error);
      }
    }
  }, [user]);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance, last_daily_reward')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBalance(data.balance);
        // Check for daily reward
        await checkDailyReward(data);
        // Refresh balance after potential daily reward
        const { data: refreshedData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        if (refreshedData) {
          setBalance(refreshedData.balance);
        }
      } else {
        // Create wallet if doesn't exist - give 5 free coins to start
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 5, last_daily_reward: new Date().toISOString() })
          .select('balance')
          .single();
        
        // Record the welcome bonus transaction
        if (newWallet && !createError) {
          await supabase.from('coin_transactions').insert({
            user_id: user.id,
            amount: 5,
            transaction_type: 'bonus',
            description: 'Welcome bonus - 5 free coins'
          });
          setBalance(5);
        } else if (createError && createError.code !== '23505') {
          console.error('Error creating wallet:', createError);
          setBalance(0);
        } else {
          // Wallet might already exist due to race condition, fetch it
          const { data: existingWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();
          setBalance(existingWallet?.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [user, checkDailyReward]);

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('coins', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  const spendCoins = async (amount: number, description: string, relatedId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('spend_coins', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description,
        p_related_id: relatedId || null
      });

      if (error) throw error;
      
      if (data) {
        await fetchWallet();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending coins:', error);
      return false;
    }
  };

  const transferCoins = async (
    toCreatorId: string, 
    amount: number, 
    description: string, 
    relatedId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('transfer_coins', {
        p_from_user_id: user.id,
        p_to_creator_id: toCreatorId,
        p_amount: amount,
        p_description: description,
        p_related_id: relatedId || null
      });

      if (error) throw error;
      
      if (data) {
        await fetchWallet();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error transferring coins:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchPackages();
  }, [fetchWallet, fetchPackages]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // Subscribe to wallet updates - use unique channel name per component instance
  useEffect(() => {
    if (!user) return;

    const channelId = `wallet_updates_${user.id}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWallet();
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallet, fetchTransactions]);

  return {
    balance,
    loading,
    packages,
    transactions,
    spendCoins,
    transferCoins,
    refreshWallet: fetchWallet,
    refreshTransactions: fetchTransactions
  };
};
