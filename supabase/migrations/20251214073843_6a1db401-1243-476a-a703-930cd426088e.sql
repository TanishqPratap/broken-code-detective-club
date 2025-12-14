-- Create referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  referrer_coins_awarded integer NOT NULL DEFAULT 0,
  referred_coins_awarded integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can look up referral codes (needed during signup)
CREATE POLICY "Anyone can lookup referral codes by code"
ON public.referral_codes FOR SELECT
USING (true);

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "System can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to process referral and award coins
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referral_code text,
  p_referred_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_reward integer := 5;
  v_referred_reward integer := 3;
BEGIN
  -- Find the referrer by code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_referral_code);
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN false;
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_coins_awarded, referred_coins_awarded)
  VALUES (v_referrer_id, p_referred_user_id, v_referrer_reward, v_referred_reward);
  
  -- Award coins to referrer
  PERFORM public.add_coins(
    v_referrer_id,
    v_referrer_reward,
    'referral',
    'Referral bonus - friend signed up',
    NULL,
    p_referred_user_id::text
  );
  
  -- Award coins to referred user
  PERFORM public.add_coins(
    p_referred_user_id,
    v_referred_reward,
    'referral_bonus',
    'Bonus for using referral code',
    NULL,
    v_referrer_id::text
  );
  
  RETURN true;
END;
$$;