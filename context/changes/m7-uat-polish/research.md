# M7 UAT Polish Research

## Findings

1. **Exercise Badges (FR-030)**:
   - File: `src/components/ExerciseSequence.tsx`
   - Lines ~238: `{currentExercise.body_areas.map((area) => (<Badge key={area} variant="secondary" className="uppercase text-xs">{area}</Badge>))}`
   - Action: We need a mapping dictionary (e.g. `const BODY_AREA_LABELS: Record<string, string> = { eyes: "Oczy", neck: "Kark", shoulders: "Barki", lower_back: "Lędźwie", general: "Ogólne" }`) and use it in the map.

2. **Timer Notifications (FR-031)**:
   - File: `src/components/PomodoroTimer.tsx`
   - Lines ~40: Timer checks if elapsed >= total. When it reaches this, it transitions to `status = "expired"`.
   - Action: We can trigger an `Audio` chime and update `document.title` here. We must remember to reset `document.title` when the timer is cleared or reset.

3. **Idle Break Timer (FR-032)**:
   - File: `src/components/ExerciseSequence.tsx` (the end screen)
   - At the end of the sequence (when `status === "completed"`), it shows the "Resume work?" prompt.
   - Action: Add UI to this completion screen allowing the user to select an idle break (3m, 5m, 10m). When selected, we could either redirect them to a new idle break view, or keep them on the page with a countdown. A simple countdown in the same component is easiest.

4. **Image & 24 Seed Exercises (FR-033)**:
   - Need to add `image` column to the `exercise` table via a new migration in `supabase/migrations/`.
   - Need to update `src/types.ts` `Exercise` interface to include `image?: string`.
   - Wait for user to provide the SVG assets and `exercises.seed.json` to complete the seed.
