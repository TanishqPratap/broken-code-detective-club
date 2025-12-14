-- Add column to track last daily reward claim
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS last_daily_reward timestamp with time zone DEFAULT NULL;