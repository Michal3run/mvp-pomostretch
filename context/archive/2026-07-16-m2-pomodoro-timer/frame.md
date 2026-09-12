# Frame Brief: m2-pomodoro-timer

> Framing step before /10x-plan. This document captures what is _actually_
> at issue, separated from what was initially assumed.

## Reported Observation

Potrzebujemy licznika Pomodoro (25 min) na dashboardzie, który przetrwa odświeżanie strony i prawidłowo obsłuży koniec czasu (FR-005 - FR-009, NFR-2).

## Initial Framing (preserved)

- **User's stated cause or approach**: NFR-2 (przetrwanie po odświeżeniu) i blokowanie zakładek w tle wymaga użycia `localStorage` z fallbackiem (Lesson L4) oraz kalkulacji czasu na bazie delty `Date.now()`.
- **User's proposed direction**: Zbudowanie komponentu React (island) `<PomodoroTimer />` podpiętego do `dashboard.astro` oraz dedykowanego wrappera `src/lib/timer-storage.ts`.
- **Pre-dispatch narrowing**: I'm not sure / haven't separated them yet

## Dimension Map

The observation could originate at any of these dimensions:

1. **Browser Execution Throttling** — The interval stops completely in background, meaning auto-navigate won't fire exactly when time expires, but only when the user returns.
2. **Client-side State Volatility** — `localStorage` fails in incognito mode (quota=0), breaking NFR-2 (refresh survival) completely unless the fallback is bulletproof. ← initial framing
3. **Session Expiry Timing (60s rule)** — Skew in `Date.now()` after OS sleep might break the overdue check (`elapsed >= total by <= 60s`), causing jarring redirects instead of the "Expired Session UI".

## Hypothesis Investigation

| Hypothesis                       | Evidence                                                                                                                                          | Verdict             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Browser Execution Throttling     | Codebase lacks `visibilitychange` handlers. `setInterval` will fail to fire in background. Needs delta calculation + visibility event to recover. | STRONG              |
| Client-side State Volatility     | Lesson L4 explicitly names this risk and mandates the try-catch fallback. `Banner.astro` exists as a potential pattern.                           | STRONG              |
| Session Expiry Timing (60s rule) | Roadmap explicitly accounts for OS sleep. Delta checking `Date.now() - startedAt` correctly triggers manual recovery if `>60s`.                   | NONE (Rule is safe) |

## Narrowing Signals

Decisive observations from Step 4 (user reports + sub-agent findings) that narrowed the hypothesis space:

- Step 3 found strong evidence that the proposed framing (Lesson L4 fallback + Date.now() delta) is the exact correct mitigation for the identified dimensions. Skipping questioning step; reframing directly.

## Cross-System Convention

Timer durability is explicitly guided by `context/foundation/lessons.md` (L4) and the `roadmap.md` M2 specification. The leading hypothesis exactly matches the convention required by the project.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: The initial framing was correct — proceed with the originally proposed direction.

The plan must address both UI state recovery via `localStorage` (with try-catch fallbacks) and execution throttling via `visibilitychange` listeners to accurately reflect elapsed time after OS sleep or tab backgrounding.

## Confidence

- **HIGH** — strong evidence + matches convention + decisive narrowing signal

## What Changes for /10x-plan

The initial framing held up. The plan should proceed to define the exact implementation details for the `<PomodoroTimer>` island and `timer-storage.ts` wrapper.

## References

- Source files: `context/foundation/lessons.md`, `context/foundation/roadmap.md`
- Related research: `context/changes/m2-pomodoro-timer/research.md`
- Investigation tasks: task-86493e69, task-2bc1d0cc, task-662e5905
