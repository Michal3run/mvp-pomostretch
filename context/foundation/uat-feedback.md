# User Acceptance Testing (UAT) Feedback - Post M1-M5

**Date**: 2026-08-02
**Reviewer**: User (Manual testing)

## 1. Lack of Exercise Randomization (Repeated sequence)
- **Observation**: Selecting "Tylko oczy" always returns "Powolne mruganie..." first, followed by "Zasada 20-20-20". The order never changes.
- **Root Cause**: The `rule-engine.ts` is mathematically designed to randomize *only if* there are more than 3 matching fresh candidates. Since the M1 seed catalog only contains 2 exercises for "Tylko oczy", all 2 are selected and then predictably sorted by duration (shortest first).
- **Action Plan**: This is working as implemented, but the catalog size prevents the "randomness" from kicking in. In Post-MVP (or M7), we need to expand the exercise catalog to have at least 4-5 exercises per category.

## 2. English Badges in UI
- **Observation**: The quick pick buttons are in Polish ("TYLKO OCZY"), but the exercise badges display the raw database keys in English ("eyes"). 
- **Root Cause**: The UI component `ExerciseSequence.tsx` renders `exercise.body_areas` directly without passing them through a localization dictionary.
- **Action Plan**: Add a display dictionary mapping (`eyes` -> `Oczy`, `neck` -> `Kark`, etc.) in the UI layer.

## 3. Pomodoro Timer Does Not "Time" The Break
- **Observation**: After finishing exercises, the app asks to start a new 25m work session. The user expected a 5 or 10-minute break timer countdown *after* or *instead of* the exercises.
- **Root Cause**: Initially designed as a feature in `prd.md` to replace passive breaks with active stretching. However, real-world usage reveals this is too rigid. Users still need normal "idle" break time (for tea, bathroom) after the 2-3 minutes of exercises.
- **Action Plan**: Introduce an optional "Idle Break" timer after the exercise sequence completes. The user should be able to choose between immediately starting a new work session (25m) or taking an additional 3, 5, or 10-minute idle break.

## 4. Lack of Notifications at 25m Expiry
- **Observation**: When the 25m timer hits zero, it's not clear if there is any sound or visual notification outside of the tab.
- **Root Cause**: Out-of-tab notifications (Web Push) were explicitly excluded in the PRD Anti-goals (Line 198) due to permissions UX. However, we missed implementing "in-tab" non-intrusive notifications (like a chime sound or updating the `document.title` to "(00:00) Przerwa!").
- **Action Plan**: Add `document.title` countdown/alert and a subtle chime sound when the timer transitions to `expired` state.
