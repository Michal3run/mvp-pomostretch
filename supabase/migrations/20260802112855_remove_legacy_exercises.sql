-- Remove old seed exercises that don't have images to prevent duplicates
DELETE FROM public.exercise WHERE image IS NULL;
