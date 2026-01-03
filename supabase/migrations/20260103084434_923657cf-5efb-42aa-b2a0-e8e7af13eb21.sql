-- Public creator directory view (safe fields only; excludes email)
-- Fixes Discover listing after restricting profiles RLS.

CREATE OR REPLACE VIEW public.creator_directory AS
SELECT
  id,
  username,
  display_name,
  bio,
  avatar_url,
  role,
  is_verified,
  created_at,
  updated_at,
  subscription_price,
  subscription_price_coins,
  chat_rate,
  chat_rate_coins
FROM public.profiles
WHERE role = 'creator';

GRANT SELECT ON public.creator_directory TO anon, authenticated;
