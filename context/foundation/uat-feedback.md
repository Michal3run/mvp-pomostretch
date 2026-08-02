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
- **Root Cause**: This is actually a feature, not a bug, per `prd.md` (Line 179). The product's core loop replaces the passive "5 minute wait" with an active "sequence of exercises". The exercise sequence *is* the break.
- **Action Plan**: No code change needed. The PRD explicitly designed this flow to maximize compliance and reduce idle phone-scrolling time. If user feedback strongly insists on idle breaks, we may need to introduce a "Skip exercises and just rest" fallback timer in a future iteration.

## 4. Lack of Notifications at 25m Expiry
- **Observation**: When the 25m timer hits zero, it's not clear if there is any sound or visual notification outside of the tab.
- **Root Cause**: Out-of-tab notifications (Web Push) were explicitly excluded in the PRD Anti-goals (Line 198) due to permissions UX. However, we missed implementing "in-tab" non-intrusive notifications (like a chime sound or updating the `document.title` to "(00:00) Przerwa!").
- **Action Plan**: Add `document.title` countdown/alert and a subtle chime sound when the timer transitions to `expired` state.
