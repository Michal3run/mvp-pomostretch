# M2: Pomodoro Timer Implementation Plan

## Overview
We are implementing the Pomodoro timer on the user dashboard. This vertical slice transforms the dashboard into a functional 25-minute timer with start, extend (+5 min), and manual break transitions. Crucially, the timer state will survive page refreshes (NFR-2) via a safe `localStorage` wrapper, and it will correctly handle browser tab suspension by calculating remaining time via `Date.now()` deltas and `visibilitychange` events.

## Current State Analysis
Currently, `src/pages/dashboard.astro` is a 28-line SSR placeholder showing authenticated user info. There is no `PomodoroTimer` component, nor any `localStorage` wrappers in `src/lib/`. The `Banner.astro` component exists but is used only for server missing configs.

## Desired End State
The dashboard features an interactive React island `<PomodoroTimer client:load />`. When started, it persists its state (`startedAt`, `durationMs`, `extendedMs`) to `pomostretch.timer` in `localStorage`. If the tab is refreshed, the timer seamlessly resumes. If the timer expires in the background and the tab is refocused within 60s, it immediately navigates to `/break-input`. If refocused after 60s, it presents an expired session card requiring manual continuation.

### Key Discoveries:
- Lesson L4 requires `try-catch` around all `localStorage` access and an in-memory fallback with a visible UI warning.
- `setInterval` is heavily throttled in background tabs; an exact `Date.now()` delta combined with `document.addEventListener("visibilitychange")` is necessary for accurate end-of-time detection.
- `PROTECTED_ROUTES` in `src/middleware.ts` needs to include `/break-input` and we need a minimal `src/pages/break-input.astro` placeholder to prevent 404s during timer redirects.

## What We're NOT Doing
- We are NOT building the actual break input form or database storage for completed sessions (that is M3).
- We are NOT implementing global/cross-device syncing (timer lives locally on the specific device/browser).

## Implementation Approach
We will build sequentially from pure data utility (storage wrapper), to routing prerequisite (placeholder page), to the complex React island (the timer itself), and finally mount it on the dashboard page.

## Critical Implementation Details
- **Timing & lifecycle**: The timer's `visibilitychange` listener must be the single source of truth for background wake-ups, forcing an immediate delta recalculation before the next 1000ms interval tick.
- **State sequencing**: For manual or auto-transitions, clear `localStorage` FIRST, then trigger `window.location.href = "/break-input"` to avoid race conditions on page unload.

## Phase 1: Timer Storage Utility

### Overview
Create the safe `localStorage` wrapper for timer persistence in `src/lib/timer-storage.ts`.

### Changes Required:

#### 1. TimerState Type
**File**: `src/types.ts`
**Intent**: Create the shared types file (per AGENTS.md convention: "Shared entities/DTOs go in `src/types.ts`") and define the `TimerState` interface.
**Contract**: Export `TimerState` with `startedAt: number`, `durationMs: number`, `extendedMs: number` matching the roadmap schema (roadmap.md L298-L303).

#### 2. Timer Storage Utility
**File**: `src/lib/timer-storage.ts`
**Intent**: Implement typed functions (`getStoredTimer`, `saveStoredTimer`, `clearStoredTimer`) for managing the `TimerState` schema in `localStorage` under the key `pomostretch.timer`.
**Contract**: Imports `TimerState` from `@/types`. Must wrap `localStorage` access in `try-catch`. If an error occurs, it catches silently and returns an object indicating storage is unavailable (for `getStoredTimer`) or fails gracefully (for save/clear), allowing the consumer to fall back to in-memory state.

### Success Criteria:

#### Automated Verification:
- [ ] 1.1 Type checking passes: `npm run typecheck`
- [ ] 1.2 Linting passes: `npm run lint`

#### Manual Verification:
- [ ] 1.3 `src/types.ts` exports `TimerState` interface
- [ ] 1.4 `timer-storage.ts` imports `TimerState` from `@/types` and exposes functions handling `try-catch` correctly

---

## Phase 2: Break Input Placeholder & Middleware

### Overview
Add the `/break-input` route placeholder so the timer's auto-navigate has a valid destination.

### Changes Required:

#### 1. Placeholder Page
**File**: `src/pages/break-input.astro`
**Intent**: Create a minimal Astro page to act as the destination for completed Pomodoro sessions.
**Contract**: **Must** export `const prerender = false;` — SSR pages that access `Astro.locals` (e.g., for auth checks via middleware) cannot be prerendered. Renders a simple "M3: Break Input Placeholder" message wrapped in the project `Layout`.

#### 2. Auth Middleware
**File**: `src/middleware.ts`
**Intent**: Add `/break-input` to the `PROTECTED_ROUTES` array.
**Contract**: Enforces that only authenticated users can access the break input page.

### Success Criteria:

#### Automated Verification:
- [ ] 2.1 Type checking passes: `npm run typecheck`
- [ ] 2.2 Route is accessible in dev server

#### Manual Verification:
- [ ] 2.3 Navigating to `/break-input` as an authenticated user displays the placeholder
- [ ] 2.4 Navigating to `/break-input` unauthenticated redirects to `/auth/signin`

---

## Phase 3: Pomodoro Timer React Island

### Overview
Build the core timer logic, including interval ticking, visibility recovery, and storage fallbacks.

### Changes Required:

#### 1. React Island
**File**: `src/components/PomodoroTimer.tsx`
**Intent**: Create the interactive timer UI component managing states (Idle, Active, ExpiredCard).
**Contract**: 
- Uses `timer-storage.ts` to hydrate initial state on mount. 
- Displays a dismissible top banner warning if storage is unavailable. **Note**: `Banner.astro` is an Astro component and cannot be used inside a React island — this warning must be a React element (e.g., styled `<div>`) rendered inside `PomodoroTimer.tsx`.
- Uses `setInterval` (1000ms) to tick, calculating remaining time purely via `Date.now()` delta.
- Attaches `visibilitychange` listener to force immediate recalculation on tab focus.
- Immediately navigates to `/break-input` if elapsed >= total by <= 60s, or shows the manual ExpiredCard if > 60s.
- **ExpiredCard "Pomiń i zacznij nową sesję" button**: Clears `localStorage`, returns the component to Idle state (showing "Start work session" button). Does NOT auto-start a new timer.
- **Race condition guard**: All navigation paths (manual end, auto-expire, expired card "Rozpocznij przerwę teraz") must clear `localStorage` before triggering `window.location.href` to prevent race conditions on page unload.

### Success Criteria:

#### Automated Verification:
- [ ] 3.1 Type checking passes: `npm run typecheck`
- [ ] 3.2 Linting passes: `npm run lint`

#### Manual Verification:
- [ ] 3.3 Component renders in Storybook/isolated test or local environment without errors

---

## Phase 4: Dashboard Integration

### Overview
Mount the React island into the user dashboard.

### Changes Required:

#### 1. Dashboard Page
**File**: `src/pages/dashboard.astro`
**Intent**: Replace the placeholder text with the `<PomodoroTimer client:load />` component.
**Contract**: Retains the existing layout and user greeting, but positions the interactive timer prominently in the view.

### Success Criteria:

#### Automated Verification:
- [ ] 4.1 Build succeeds: `npm run build`

#### Manual Verification:
- [ ] 4.2 Timer accurately counts down from 25:00 and persists after F5 refresh
- [ ] 4.3 `+5 min` button adds 300 seconds to the remaining time
- [ ] 4.4 "Zaczynaj przerwę" button manually clears storage and navigates to `/break-input`
- [ ] 4.5 Sleeping the OS for 2 hours during an active session shows the "Sesja zakończona" card upon wake-up
- [ ] 4.6 Blocking `localStorage` (via browser devtools) correctly displays the dismissible fallback warning banner
- [ ] 4.7 Dashboard shows "Start work session" button when no active timer (Idle state)
- [ ] 4.8 Timer state clears from `localStorage` when session ends (manual or auto)
- [ ] 4.9 (Handoff) Start timer, refresh at 12 min remaining — resumes correctly (±2s)
- [ ] 4.10 (Handoff) Start timer, close tab, reopen within 10s — resumes
- [ ] 4.11 (Handoff) Start timer, let it run to 00:00 — auto-navigation to `/break-input` fires

---

## Testing Strategy

### Unit Tests:
- Ensure the `timer-storage.ts` gracefully degrades when `localStorage` is disabled.

### Integration Tests:
- N/A for this phase, relies on E2E/manual.

### Manual Testing Steps:
1. Start the timer, wait 3 seconds, refresh the page. Verify the timer resumes from 24:57.
2. Start the timer, disable `localStorage` in devtools, refresh. Verify the fallback banner appears.
3. Start the timer, simulate 26 minutes passing in background (e.g. modify localStorage `startedAt` manually to 26 mins ago). Focus the tab. Verify the Expired Session card appears.

## Performance Considerations
- `setInterval` running at 1000ms is standard and lightweight; ensure it is cleared on unmount to prevent memory leaks.

## Migration Notes
- No database migrations needed. `pomostretch.timer` is strictly client-side.

## References
- Related research: `context/changes/m2-pomodoro-timer/research.md`
- Frame brief: `context/changes/m2-pomodoro-timer/frame.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Timer Storage Utility

#### Automated

- [x] 1.1 Type checking passes: `npm run typecheck` (using npx astro check)
- [x] 1.2 Linting passes: `npm run lint`

#### Manual

- [x] 1.3 `src/types.ts` exports `TimerState` interface
- [x] 1.4 `timer-storage.ts` imports `TimerState` from `@/types` and exposes functions handling `try-catch` correctly

### Phase 2: Break Input Placeholder & Middleware

#### Automated

- [x] 2.1 Type checking passes: `npm run typecheck`
- [x] 2.2 Route is accessible in dev server

#### Manual

- [x] 2.3 Navigating to `/break-input` as an authenticated user displays the placeholder
- [x] 2.4 Navigating to `/break-input` unauthenticated redirects to `/auth/signin`

### Phase 3: Pomodoro Timer React Island

#### Automated

- [ ] 3.1 Type checking passes: `npm run typecheck`
- [ ] 3.2 Linting passes: `npm run lint`

#### Manual

- [ ] 3.3 Component renders in Storybook/isolated test or local environment without errors

### Phase 4: Dashboard Integration

#### Automated

- [ ] 4.1 Build succeeds: `npm run build`

#### Manual

- [ ] 4.2 Timer accurately counts down from 25:00 and persists after F5 refresh
- [ ] 4.3 `+5 min` button adds 300 seconds to the remaining time
- [ ] 4.4 "Zaczynaj przerwę" button manually clears storage and navigates to `/break-input`
- [ ] 4.5 Sleeping the OS for 2 hours during an active session shows the "Sesja zakończona" card upon wake-up
- [ ] 4.6 Blocking `localStorage` (via browser devtools) correctly displays the dismissible fallback warning banner
- [ ] 4.7 Dashboard shows "Start work session" button when no active timer (Idle state)
- [ ] 4.8 Timer state clears from `localStorage` when session ends (manual or auto)
- [ ] 4.9 (Handoff) Start timer, refresh at 12 min remaining — resumes correctly (±2s)
- [ ] 4.10 (Handoff) Start timer, close tab, reopen within 10s — resumes
- [ ] 4.11 (Handoff) Start timer, let it run to 00:00 — auto-navigation to `/break-input` fires
