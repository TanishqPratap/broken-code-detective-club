
-- Create subscription tiers table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stream subscriptions table to track who has paid for which stream
CREATE TABLE public.stream_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.subscription_tiers(id),
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stream_id, subscriber_id)
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription tiers (readable by all authenticated users)
CREATE POLICY "Everyone can view subscription tiers" ON public.subscription_tiers
  FOR SELECT TO authenticated USING (is_active = true);

-- Policies for stream subscriptions
CREATE POLICY "Users can view their own stream subscriptions" ON public.stream_subscriptions
  FOR SELECT TO authenticated USING (subscriber_id = auth.uid());

CREATE POLICY "Users can create their own stream subscriptions" ON public.stream_subscriptions
  FOR INSERT TO authenticated WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Users can update their own stream subscriptions" ON public.stream_subscriptions
  FOR UPDATE TO authenticated USING (subscriber_id = auth.uid());

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (name, price, description, features) VALUES
  ('Basic Access', 9.99, 'Access to live streams', ARRAY['Live stream access', 'Chat participation']),
  ('Premium Access', 19.99, 'Enhanced streaming experience', ARRAY['Live stream access', 'Chat participation', 'HD quality', 'Priority support']),
  ('VIP Access', 49.99, 'Ultimate streaming experience', ARRAY['Live stream access', 'Chat participation', 'HD quality', 'Priority support', 'Exclusive content', 'Direct creator contact']);
