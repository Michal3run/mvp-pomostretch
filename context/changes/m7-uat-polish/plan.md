# M7 UAT Polish Implementation Plan

## Phase 1: Badges & Timer Notifications
- Update `src/components/ExerciseSequence.tsx` to use a Polish localization dictionary for `body_areas` badges.
- Update `src/components/PomodoroTimer.tsx` to play a subtle sound and change `document.title` to "(00:00) Przerwa!" when the timer expires. Restore title when timer resets.
- **Safety**: Wrap the `audio.play()` call in `.catch(() => {})` to gracefully handle browser autoplay restrictions without crashing.

## Phase 2: Idle Break Timer
- Update `src/components/ExerciseSequence.tsx` completion screen.
- Add an optional "Idle Break" countdown state (3m, 5m, 10m) that users can start after completing their exercises, before starting a new work session.

## Phase 3: DB Image Schema & Expanded Seed
- Create a new Supabase migration (e.g. `20260802100000_add_exercise_image.sql`) adding `ALTER TABLE public.exercise ADD COLUMN image text;`.
- Create a migration to delete old seed exercises and insert the new 24 exercises using the data from `supabase/exercises-seed.json`. Ensure `name_pl` maps to `name`, `description_pl` maps to `description`, and `target_areas` is normalized to our canonical `body_areas` array.
- Update `src/types.ts` to include `image?: string` in `Exercise`.
- Render the `image` inside `ExerciseSequence.tsx` using an `<img>` tag pointing to `/{image}` since images are now in `public/images/`.
