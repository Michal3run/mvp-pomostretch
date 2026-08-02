-- Migration: Explicitly revert public read policy and restore authenticated-only RLS policy on exercise table
DROP POLICY IF EXISTS "Allow read access for all users" ON public.exercise;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.exercise;

CREATE POLICY "Allow read access for authenticated users"
ON public.exercise
FOR SELECT
TO authenticated
USING (true);
