# Plan: M3 Break Input

## Contract

**Goal**: Implement the break input screen with 4 quick-picks and a free-text option, passing data to an API route and redirecting to the exercise sequence, replacing the M3 placeholder.

## Progress

- [x] 1. **API Route setup**
  - Create `src/pages/api/break-input.ts`.
  - Add `export const prerender = false;`.
  - Export a `POST` function that parses form data.
  - Implement a basic keyword matcher to extract body area tags (e.g. "oczy", "kark", "ogólne").
  - Set signed cookie `pomostretch.break_input` with `{ kind: "quick-pick" | "free-text", value: string, tags: string[] }` and a 5-minute expiration.
  - Redirect to `/exercise-sequence`.
- [x] 2. **UI Implementation**
  - Update `src/pages/break-input.astro` to remove the placeholder.
  - Build a form with `method="POST" action="/api/break-input"`.
  - Add 4 quick-pick buttons: "Tylko oczy", "Tylko kark", "Ogólne", "Zaskocz mnie" (submitting `name="quickPick" value="..."`).
  - Add a free-text textarea (`name="freeText"`) and a submit button.
  - Add a "Skip break" link that points to `/dashboard`.
- [x] 3. **Validation & Edge Cases**
  - Make sure the API handler safely handles empty submissions and invalid data.
  - Confirm UI components use `shadcn/ui` where applicable.

## Notes

- This plan covers M3 logic. It integrates smoothly with the M2 pomodoro timer and sets up the state for the M4 exercise sequence.
