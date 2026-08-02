-- Fix: revoke SELECT from anon role (was incorrectly granted in previous migration).
-- Only the 'authenticated' role should have SELECT access, matching the RLS policy.
REVOKE SELECT ON public.exercise FROM anon;
GRANT SELECT ON public.exercise TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
