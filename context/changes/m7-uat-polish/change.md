# M7: UAT & Feedback Polish (Post-MVP)

**Change ID**: `m7-uat-polish`
**Status**: completed
**Created**: 2026-08-02
**Completed**: 2026-08-02

## Context

During manual testing of the M1-M5 end-to-end flow, the user identified several friction points and missing polish features. We are iterating on the MVP to resolve these before final certification (M6).

## Scope (Deliverables)

1. **FR-030**: Add client-side localization dictionary in `ExerciseSequence.tsx` to map DB tags (e.g., `eyes` -> `Oczy`).
2. **FR-031**: Add in-tab notifications (audio chime + `document.title` update) for the Pomodoro timer expiry.
3. **FR-032**: Add an optional 3/5/10 minute "Idle Break" timer after completing the exercise sequence.
4. **FR-033**: Add an `image` column to the `exercise` table, display SVG visualizations in the UI, and expand the seed catalog to 24 exercises (requiring the user to provide the `exercises.seed.json` and SVG files).

## Files to Modify (Expected)

- `src/components/ExerciseSequence.tsx`
- `src/components/PomodoroTimer.tsx` (or where timer logic lives)
- `supabase/migrations/` (new migration for `image` column and new rows)
- `src/types.ts` (update `Exercise` interface)
