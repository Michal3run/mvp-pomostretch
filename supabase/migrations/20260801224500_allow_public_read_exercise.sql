-- Migration: Allow public read access (anon and authenticated) for exercise catalog
-- Ensures exercise sequence can fetch exercises regardless of auth session role

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.exercise;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.exercise;

CREATE POLICY "Allow read access for all users"
ON public.exercise
FOR SELECT
TO public
USING (true);
