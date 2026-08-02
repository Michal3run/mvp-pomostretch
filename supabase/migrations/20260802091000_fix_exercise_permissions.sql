-- Force grant table permissions and reload schema cache to fix 404
GRANT SELECT ON public.exercise TO authenticated;
GRANT SELECT ON public.exercise TO anon;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
