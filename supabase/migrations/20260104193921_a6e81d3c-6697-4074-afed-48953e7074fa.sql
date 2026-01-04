-- Drop the misleading policy (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- RLS is already enabled on the table, and with NO policies for anon/authenticated,
-- regular users cannot access this table at all.
-- Only service_role (used by edge functions) can access it, which is the intended behavior.

-- Verify RLS is enabled (this is idempotent)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (extra security)
ALTER TABLE public.password_reset_tokens FORCE ROW LEVEL SECURITY;