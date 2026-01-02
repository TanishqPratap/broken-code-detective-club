-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;

-- Create a new restrictive policy that only allows viewing non-sensitive fields
-- Users can only see their own complete profile (including email)
-- For other users, they should use the public_profiles view instead

-- The existing "Users can view own complete profile" policy already handles self-access
-- We just needed to remove the public access policy