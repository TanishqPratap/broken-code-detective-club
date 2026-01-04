-- Drop and recreate safe_profiles view without email column
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles AS
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
    profiles.subscription_price,
    profiles.chat_rate
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO anon;
GRANT SELECT ON public.safe_profiles TO authenticated;