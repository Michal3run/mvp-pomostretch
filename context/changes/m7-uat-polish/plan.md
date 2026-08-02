# M7 UAT Polish Implementation Plan

## Phase 1: Badges & Timer Notifications
- Update `src/components/ExerciseSequence.tsx` to use a Polish localization dictionary for `body_areas` badges.
- Update `src/components/PomodoroTimer.tsx` to play a subtle sound and change `document.title` to "(00:00) Przerwa!" when the timer expires. Restore title when timer resets.

## Phase 2: Idle Break Timer
- Update `src/components/ExerciseSequence.tsx` completion screen.
- Add an optional "Idle Break" countdown state (3m, 5m, 10m) that users can start after completing their exercises, before starting a new work session.

## Phase 3: DB Image Schema & Expanded Seed
- Create a new Supabase migration (e.g. `20260802100000_add_exercise_image.sql`) adding `ALTER TABLE public.exercise ADD COLUMN image text;`.
- Update `src/types.ts` to include `image?: string` in `Exercise`.
- Await the user's upload of `exercises.seed.json` and SVG files to generate the migration that deletes the old 15 seeds and inserts the new 24 seeds.
- Render the `image` in `ExerciseSequence.tsx`.
