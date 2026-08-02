# M7 UAT Polish Implementation Plan

## Phase 1: Badges & Timer Notifications

- [x] Update `src/components/ExerciseSequence.tsx` to use a Polish localization dictionary for `body_areas` badges.
- [x] Update `src/components/PomodoroTimer.tsx` to play a subtle sound and change `document.title` to "(00:00) Przerwa!" when the timer expires. Restore title when timer resets.
- [x] **Safety**: Wrap the `audio.play()` call in `.catch(() => {})` to gracefully handle browser autoplay restrictions without crashing.
- [x] **UI Polish**: Translate the hardcoded English string "Start work session" in `PomodoroTimer.tsx` (around line 142) to Polish.

## Phase 2: Idle Break Timer

- [x] Update the break flow to treat the Idle Break as a first-class state: `Timer expires` -> `Break Input` -> `Exercise Sequence` -> `Idle Break (optional)` -> `Resume Work`.
- [x] In `src/components/ExerciseSequence.tsx`, when exercises complete, present the options: "Wróć do pracy (Zakończ)", "+3 min odpoczynku", "+5 min", "+10 min".
- [x] If an idle break is selected, start a visual countdown. When it expires, play the chime again and present the "Wróć do pracy" button.

## Phase 3: DB Image Schema & 25 Seed Exercises

- [x] Create a new Supabase migration (e.g. `20260802100000_add_exercise_image.sql`) adding `ALTER TABLE public.exercise ADD COLUMN image text;`.
- [x] Create a data migration script to insert the 25 new exercises from `supabase/exercises-seed.json`.
- [x] **CRITICAL - [x] Migration Safe-guards (Addressing 5 Risks)**:
  - [x] **Risk C & D (FK & UUIDs)**: Do NOT delete old exercises to avoid breaking foreign keys in `break_session`. Insert the new 25 alongside them. Let Postgres `gen_random_uuid()` generate IDs. Ignore the string `id` from JSON.
  - [x] **Risk A & B (Tags)**: Map `target_areas` to canonical `body_areas` using this logic:
    - [x] `eyes` -> `eyes`, `neck` -> `neck`, `shoulders` -> `shoulders`, `lower_back` -> `lower_back`
    - [x] `upper_back`, `chest` -> `shoulders`
    - [x] `breathing`, `wrists_hands`, `glutes`, `hips`, `legs`, `posture` -> `general`
    - [x] This ensures all exercises get valid canonical tags, guaranteeing that `general` fallback always has candidates.
  - [x] Map `name_pl` -> `name` and `description_pl` -> `description`.
- [x] Update `src/types.ts` to include `image?: string` in `Exercise`.
- [x] Render the `image` inside `ExerciseSequence.tsx` using an `<img>` tag.
