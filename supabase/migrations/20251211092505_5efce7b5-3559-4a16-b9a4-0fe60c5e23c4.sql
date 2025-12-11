-- Create coin packages table
CREATE TABLE public.coin_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coins integer NOT NULL,
  price_usd numeric NOT NULL,
  gumroad_link text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages
CREATE POLICY "Anyone can view active coin packages"
ON public.coin_packages FOR SELECT
USING (is_active = true);

-- Create user wallets table
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update their own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own wallet
CREATE POLICY "Users can insert their own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create coin transactions table
CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'purchase', 'spend', 'earn', 'withdrawal'
  description text,
  related_id uuid, -- reference to subscription, tip, etc.
  gumroad_sale_id text, -- for coin purchases
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own coin transactions"
ON public.coin_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert their own coin transactions"
ON public.coin_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  coins_amount integer NOT NULL,
  usd_amount numeric NOT NULL,
  payment_method text NOT NULL, -- 'bank', 'upi', 'paypal'
  payment_details jsonb NOT NULL, -- bank details, UPI ID, etc.
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Creators can view their own withdrawal requests
CREATE POLICY "Creators can view their own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = creator_id);

-- Creators can create withdrawal requests
CREATE POLICY "Creators can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Add coin pricing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_price_coins integer DEFAULT NULL,
ADD COLUMN chat_rate_coins integer DEFAULT NULL;

-- Function to create wallet for new users
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create wallet when profile is created
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Function to handle coin spending
CREATE OR REPLACE FUNCTION public.spend_coins(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_related_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if enough balance
  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  -- Deduct coins
  UPDATE wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, related_id)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_related_id);
  
  RETURN true;
END;
$$;

-- Function to add coins (for purchases and earnings)
CREATE OR REPLACE FUNCTION public.add_coins(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_description text,
  p_related_id uuid DEFAULT NULL,
  p_gumroad_sale_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add coins
  UPDATE wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, related_id, gumroad_sale_id)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description, p_related_id, p_gumroad_sale_id);
  
  RETURN true;
END;
$$;

-- Function to transfer coins from user to creator
CREATE OR REPLACE FUNCTION public.transfer_coins(
  p_from_user_id uuid,
  p_to_creator_id uuid,
  p_amount integer,
  p_description text,
  p_related_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  platform_fee integer;
  creator_amount integer;
BEGIN
  -- Calculate 2% platform fee
  platform_fee := GREATEST(1, (p_amount * 2 / 100));
  creator_amount := p_amount - platform_fee;
  
  -- Spend from user
  IF NOT spend_coins(p_from_user_id, p_amount, p_description, p_related_id) THEN
    RETURN false;
  END IF;
  
  -- Add to creator (minus platform fee)
  PERFORM add_coins(p_to_creator_id, creator_amount, 'earn', 'Earned: ' || p_description, p_related_id);
  
  RETURN true;
END;
$$;