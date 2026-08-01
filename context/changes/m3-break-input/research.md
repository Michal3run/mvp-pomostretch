# Internal Research: M3 Break Input

## Context
We need to implement the break input screen (FR-010 to FR-013) that allows users to select what hurts (quick-picks or free-text) and redirects them to the exercise sequence.

## Findings
1. **Routing & Auth**: 
   - `src/pages/break-input.astro` exists as a placeholder.
   - `src/middleware.ts` already has `"/break-input"` in `PROTECTED_ROUTES`. 
2. **Form Submission**:
   - The form should use standard HTML `<form method="POST" action="/api/break-input">`.
   - We need to create `src/pages/api/break-input.ts` to handle the POST request.
3. **Data Handling & Redirection**:
   - The API handler must extract the input (quick-pick or free-text).
   - It should derive tags (for now, maybe a simple mapping, e.g., "Tylko kark" -> `["kark"]`).
   - The payload `{ kind, value, tags }` must be stored in a signed cookie `pomostretch.break_input` using `Astro.cookies.set(..., { secure: true, httpOnly: true, maxAge: 300 })` (5-minute TTL).
   - After setting the cookie, redirect to `/exercise-sequence`.
4. **Skip Break**:
   - The "Skip break" button should be a link or form that redirects back to `/dashboard` and clears any timer state if necessary (timer state is already cleared when navigating to `/break-input` via `PomodoroTimer.tsx` manual end or auto-transition).

## Conclusion
The path is clear. The primary changes are building the UI in `break-input.astro` and implementing the backend logic in `src/pages/api/break-input.ts`.
