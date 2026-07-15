-- Migration: Create break_session table with check constraints, composite index, and RLS policies
-- Covers: FR-023 through FR-027 (M1 Database Schema & Exercise Catalog)

CREATE TABLE IF NOT EXISTS public.break_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz NULL,
    input_kind text NOT NULL CHECK (input_kind IN ('quick_pick', 'free_text')),
    input_value text NOT NULL,
    derived_tags text[] NOT NULL CHECK (array_length(derived_tags, 1) > 0),
    selected_exercise_ids uuid[] NOT NULL CHECK (array_length(selected_exercise_ids, 1) BETWEEN 1 AND 3),
    completed_count int NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
    skipped_count int NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
    note text NULL CHECK (length(note) <= 500)
);

-- Note: Storing selected_exercise_ids as uuid[] matches roadmap MVP schema design (FR-023).
-- Referential integrity against public.exercise is enforced at the application layer (src/lib/rule-engine.ts).

-- Create index for high-performance history list query (FR-027, p95 < 10ms)
CREATE INDEX IF NOT EXISTS break_session_user_id_created_at_idx ON public.break_session (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.break_session ENABLE ROW LEVEL SECURITY;

-- Granular per-operation RLS policies enforcing auth.uid() = user_id
CREATE POLICY "Users can view their own break sessions"
ON public.break_session
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own break sessions"
ON public.break_session
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own break sessions"
ON public.break_session
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own break sessions"
ON public.break_session
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
