-- Drop and recreate views with SECURITY INVOKER (not SECURITY DEFINER)
-- This ensures RLS policies are evaluated based on the querying user, not the view owner

DROP VIEW IF EXISTS public.safe_profiles;
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate safe_profiles view with SECURITY INVOKER
CREATE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
SELECT 
    profiles.id,
    profiles.username,
    profiles.display_name,
    profiles.bio,
    profiles.avatar_url,
    profiles.role,
    profiles.is_verified,
    profiles.created_at,
    profiles.updated_at,
    CASE
        WHEN (auth.uid() = profiles.id) THEN profiles.email
        ELSE NULL::text
    END AS email,
    CASE
        WHEN (auth.uid() = profiles.id) THEN profiles.subscription_price
        ELSE NULL::numeric
    END AS subscription_price,
    CASE
        WHEN (auth.uid() = profiles.id) THEN profiles.chat_rate
        ELSE NULL::numeric
    END AS chat_rate
FROM profiles;

-- Recreate public_profiles view with SECURITY INVOKER
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
    profiles.id,
    profiles.username,
    profiles.display_name,
    profiles.bio,
    profiles.avatar_url,
    profiles.role,
    profiles.is_verified,
    profiles.created_at,
    profiles.updated_at,
    CASE
        WHEN (auth.uid() = profiles.id) THEN profiles.subscription_price
        WHEN (EXISTS ( SELECT 1
           FROM subscriptions
          WHERE ((subscriptions.subscriber_id = auth.uid()) AND (subscriptions.creator_id = profiles.id) AND (subscriptions.status = 'active'::text) AND (subscriptions.current_period_end > now())))) THEN profiles.subscription_price
        ELSE NULL::numeric
    END AS subscription_price,
    CASE
        WHEN (auth.uid() = profiles.id) THEN profiles.chat_rate
        ELSE NULL::numeric
    END AS chat_rate
FROM profiles;

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;