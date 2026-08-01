---
date: 2026-07-16T09:36:10+02:00
researcher: Antigravity AI (10xDevs)
git_commit: 5d8d93e78870168970cc791eb4ce12966021a3f9
branch: main
repository: Michal3run/mvp-pomostretch
topic: "M2: Pomodoro Timer UI, React Islands, and Storage Persistence Architecture"
tags: [research, codebase, pomodoro, react-islands, local-storage, astro-ssr]
status: complete
last_updated: 2026-07-16
last_updated_by: Antigravity AI (10xDevs)
---

# Research: M2: Pomodoro Timer UI, React Islands, and Storage Persistence Architecture

**Date**: 2026-07-16T09:36:10+02:00
**Researcher**: Antigravity AI (10xDevs)
**Git Commit**: 5d8d93e78870168970cc791eb4ce12966021a3f9
**Branch**: main
**Repository**: Michal3run/mvp-pomostretch

## Research Question

How should we implement the M2 Pomodoro Timer (`FR-005`–`FR-009`, `NFR-2`, Guardrail `G3`) across Astro 6 SSR pages and React 19 islands while adhering to project architectural constraints, existing UI patterns, and `lessons.md` rules (particularly L4 regarding `localStorage` durability)?

## Summary

Our investigation confirms that `src/pages/dashboard.astro` is currently a 28-line SSR placeholder that renders user authentication info. The project already uses Astro islands with the `client:load` directive for interactive forms (`SignInForm`, `SignUpForm`), plus standard `shadcn/ui` buttons in `src/components/ui/button.tsx`. However, **no storage utility wrappers or `localStorage` abstractions currently exist anywhere in `src/lib/`**.

To meet NFR-2 ("timer survives page refresh within ~30s") and Guardrail G3 without crashing in incognito mode or Safari ITP (Lesson L4), we must build a dedicated storage wrapper (`src/lib/timer-storage.ts`) that wraps `window.localStorage` in `try-catch` with in-memory React state fallbacks. Furthermore, because background browser tabs throttle `setInterval` to $\ge 1000\text{ms}$ or suspend execution completely, the timer countdown inside `src/components/PomodoroTimer.tsx` must calculate remaining time dynamically from `Date.now() - startedAt` and attach a `visibilitychange` event listener to force instant UI recalculation when returning to the tab.

## Detailed Findings

### 1. Dashboard Page & Astro Island Architecture (`src/pages/dashboard.astro`)

- **Current State**: [src/pages/dashboard.astro:1-28](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/pages/dashboard.astro#L1-L28) is an authenticated SSR page wrapped in `<Layout title="Dashboard">`. It checks `const { user } = Astro.locals;` and renders a basic welcome message with a `POST /api/auth/signout` form.
- **Island Integration Pattern**: Across `src/pages/auth/signin.astro:16` and `signup.astro:16`, interactive React components are hydrated immediately using the `client:load` directive:
  ```astro
  <SignInForm serverError={error} client:load />
  ```
  Therefore, mounting `<PomodoroTimer client:load />` (or `client:only="react"`) inside `dashboard.astro` directly follows the established project pattern.

### 2. Available UI Components & Styling Conventions (`src/components/`)

- **shadcn/ui Button**: Located at [src/components/ui/button.tsx:1-51](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/components/ui/button.tsx#L1-L51), built with `cva()` and Radix UI `Slot`. Supports `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and `size` (`default`, `sm`, `lg`, `icon`).
- **Form/Button Wrappers**: `SubmitButton.tsx` ([src/components/auth/SubmitButton.tsx:1-34](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/components/auth/SubmitButton.tsx#L1-L34)) demonstrates how interactive buttons are styled with Tailwind (`bg-purple-600 hover:bg-purple-500 rounded-lg`) and loading spinner icons.
- **Astro Banners**: `Banner.astro` ([src/components/Banner.astro:1-43](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/components/Banner.astro#L1-L43)) supports `variant="info" | "warning" | "error"`, ideal for displaying non-blocking storage fallback warnings or recently expired session alerts.

### 3. `localStorage` Durability & Lesson L4 Requirements (`context/foundation/lessons.md`)

- **Lesson L4 Citations**: [context/foundation/lessons.md:L97-L116](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/context/foundation/lessons.md#L97-L116) explicitly states that `localStorage` fails in private/incognito modes, under Safari ITP eviction, or when quota is exceeded.
- **Required Fallback**: All `localStorage.getItem`, `setItem`, and `removeItem` calls **must be wrapped in `try-catch`**. If storage throws an exception:
  1. Fall back to in-memory React state (`useState` / `useRef`).
  2. Emit a warning toast/banner: `"Timer won't persist across refreshes"`.
  3. Treat as a non-blocking known limitation (`lessons.md:L111-L112`).
- **Existing `src/lib/` Status**: `src/lib/` currently contains only `utils.ts` (`cn()`), `supabase.ts` (SSR client), and `config-status.ts` (env checks). A new utility `src/lib/timer-storage.ts` is required to centralize safe `localStorage` interaction for M2.

### 4. M2 Timer State Schema & Expiry Lifecycle (`context/foundation/roadmap.md`)

- **State Schema (`roadmap.md:L298-L303`)**:
  ```typescript
  export interface TimerState {
    startedAt: number;        // Date.now() when session began
    durationMs: number;       // 25 * 60 * 1000 (1,500,000 ms)
    extendedMs: number;       // accumulated +5min extensions (N * 300,000 ms)
  }
  ```
- **Storage Key**: `'pomostretch.timer'` (`roadmap.md:L305`).
- **On-Mount Recovery Rules (`roadmap.md:L305-L310`)**:
  Let `elapsed = Date.now() - startedAt` and `total = durationMs + extendedMs`.
  - If `elapsed < total`: Resume countdown (`total - elapsed` remaining).
  - If `elapsed >= total` and `overdueMs = elapsed - total <= 60_000` ($\le 60\text{s}$): Recently expired while away $\rightarrow$ auto-navigate to `/break-input` (`roadmap.md:L307`).
  - If `elapsed >= total` and `overdueMs > 60_000` ($> 60\text{s}$): Expired long ago $\rightarrow$ show **Expired Session UI Card** (`[Rozpocznij przerwę teraz]` / `[Pomiń i zacznij nową sesję]`) to prevent jarring redirects after hours (`roadmap.md:L308, L311-L325`).

### 5. Accurate Countdown & Browser Backgrounding (`visibilitychange`)

- **Why `setInterval` alone fails**: When a browser tab is backgrounded or the OS sleeps, intervals are throttled or frozen. Decrementing a counter (`prev - 1`) causes massive time drift.
- **Delta Calculation Pattern**: Inside `src/components/PomodoroTimer.tsx`, `setInterval` should tick every $1000\text{ms}$ merely to trigger a re-render of `Math.max(0, (durationMs + extendedMs) - (Date.now() - startedAt))`.
- **Event Listener**: Attach `document.addEventListener("visibilitychange", handleVisibilityChange)` inside `useEffect` so when `document.visibilityState === "visible"`, the timer immediately recalculates remaining time and checks for expiry transitions without waiting for the interval tick.

## Code References

- [src/pages/dashboard.astro:1-28](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/pages/dashboard.astro#L1-L28) - Current 28-line SSR dashboard placeholder to be updated with `<PomodoroTimer client:load />`.
- [src/components/ui/button.tsx:1-51](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/components/ui/button.tsx#L1-L51) - Standard shadcn/ui Button component with `cva()` variants (`default`, `outline`, `secondary`, `destructive`).
- [src/components/Banner.astro:1-43](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/components/Banner.astro#L1-L43) - Reusable alert banner component (`variant="info" | "warning" | "error"`).
- [src/pages/auth/signin.astro:16](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/src/pages/auth/signin.astro#L16) - Example of `client:load` directive hydrating interactive React island.
- [context/foundation/lessons.md:L97-L116](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/context/foundation/lessons.md#L97-L116) - Lesson L4 defining mandatory `try-catch` wrapper around `localStorage` with non-blocking UI warning.
- [context/foundation/roadmap.md:L262-L330](https://github.com/Michal3run/mvp-pomostretch/blob/5d8d93e78870168970cc791eb4ce12966021a3f9/context/foundation/roadmap.md#L262-L330) - Complete M2 technical specification, state schema, and 60-second overdue threshold rules.

## Architecture Insights

1. **Clean Separation of Storage Logic (`src/lib/timer-storage.ts`)**: Encapsulating `getStoredTimer()`, `saveStoredTimer(state)`, and `clearStoredTimer()` in a dedicated utility keeps the React island (`PomodoroTimer.tsx`) focused purely on UI rendering, interval timing, and event handling.
2. **Resilient State Hydration**: On initial mount, `PomodoroTimer.tsx` queries `getStoredTimer()`. If `isStorageAvailable === false`, it displays a non-intrusive warning while maintaining functional in-memory countdown behavior.
3. **Delta-Driven Clock**: By treating `Date.now()` as the single source of truth (`remaining = total - (Date.now() - startedAt)`), the countdown remains exact across browser tab backgrounding, CPU throttling, and system sleep.

## Historical Context (from prior changes)

- `context/changes/m1-db-schema-catalog/change.md` - Established M1 database tables (`exercise`, `break_session`) which M2 timer expiration will navigate towards (`/break-input`).
- `context/foundation/lessons.md:L97` - Lesson L4 added during project bootstrap specifically anticipating browser `localStorage` durability issues in M2.

## Related Research

- `context/foundation/roadmap.md` - Section M2 (`lines 262-330`) contains initial risk mitigation strategies for timer persistence.

## Open Questions

- None. All requirements (`FR-005`–`FR-009`, `NFR-2`, `G3`) and architectural conventions (`client:load`, shadcn/ui buttons, `try-catch` storage wrappers) are fully verified across the codebase.
