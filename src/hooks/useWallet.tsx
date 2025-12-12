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

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBalance(data.balance);
      } else {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select('balance')
          .single();
        
        if (createError && createError.code !== '23505') {
          console.error('Error creating wallet:', createError);
        }
        setBalance(newWallet?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
