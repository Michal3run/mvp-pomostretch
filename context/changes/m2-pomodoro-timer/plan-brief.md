# M2: Pomodoro Timer — Plan Brief

> Full plan: `context/changes/m2-pomodoro-timer/plan.md`
> Frame brief: `context/changes/m2-pomodoro-timer/frame.md`
> Research: `context/changes/m2-pomodoro-timer/research.md`

## What & Why

We are implementing a 25-minute Pomodoro timer on the dashboard. The timer must survive page refreshes (NFR-2) and correctly handle transitions to the break screen even if the browser tab goes to sleep or is completely suspended in the background.

## Starting Point

Currently, the dashboard (`src/pages/dashboard.astro`) is a static SSR placeholder. The project has Astro islands set up (`client:load`), but lacks any client-side storage utilities or interval-driven components.

## Desired End State

Users can start, extend (+5 min), or manually end a work session. The timer persists smoothly via `localStorage`. If the timer naturally expires while the tab is active or briefly backgrounded (<60s), it redirects to `/break-input`. If the user returns to their device hours later (>60s), it presents a manual "Sesja zakończona" card instead of jarringly redirecting them.

## Key Decisions Made

| Decision                       | Choice            | Why (1 sentence)  | Source           |
| ------------------------------ | ----------------- | ----------------- | ---------------- |
| Storage Failures               | Try-catch with in-memory fallback | Incognito mode or ITP can block `localStorage`; crashing breaks the app entirely. | Research / Frame |
| Background Throttling          | `visibilitychange` + `Date.now()` | Browsers pause `setInterval` in inactive tabs; delta calculation ensures absolute accuracy. | Research / Frame |
| Fallback UX                    | Dismissible top banner | Notifies the user their timer won't persist without blocking their workflow. | Plan |
| Missing Target Route           | Create `/break-input` placeholder | Prevents timer auto-navigation from 404ing during testing. | Plan |
| Wake-up Auto-Navigate          | Immediate redirect | Simplest execution matching the roadmap when returning within the 60s window. | Plan |

## Scope

**In scope:**
- `localStorage` safe wrapper in `src/lib/`
- React island component `<PomodoroTimer>`
- Dashboard integration
- Placeholder `/break-input` page and middleware update

**Out of scope:**
- Actual break input form and database storage (handled in M3)
- Global state or cross-device timer syncing

## Architecture / Approach

The system uses a layered approach: `timer-storage.ts` abstracts the volatile browser APIs, `<PomodoroTimer>` manages React state and lifecycle events (intervals + visibility listeners), and `dashboard.astro` handles the SSR mounting shell.

## Phases at a Glance

| Phase     | What it delivers       | Key risk                  |
| --------- | ---------------------- | ------------------------- |
| 1. Storage Utility | Safe `localStorage` wrapper | Incorrect error swallowing |
| 2. Break Route | Placeholder page & middleware | Routing misconfiguration |
| 3. Timer Island | Core countdown, recovery, and UI logic | Background tab timing bugs |
| 4. Dashboard | Final integration on the dashboard | Hydration mismatches |

**Prerequisites:** Auth must be working (M0 complete).
**Estimated effort:** ~4-5 hours

## Open Risks & Assumptions
- Testing the >60s expiry card manually requires tampering with `localStorage` timestamps.

## Success Criteria (Summary)
- Timer persists perfectly through a full page refresh (F5).
- Timer accurately computes remaining time after returning from a backgrounded tab.
- Disabling `localStorage` degrades gracefully with a visible warning banner, but the timer still functions in-memory.
