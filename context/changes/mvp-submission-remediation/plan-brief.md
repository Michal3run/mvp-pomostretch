# MVP Pre-Submission Remediation — Plan Brief

> Full plan: `context/changes/mvp-submission-remediation/plan.md`
> Related change: `context/changes/mvp-submission-remediation/change.md`
> Upstream evaluator: `.ai/prompts/mvp-check.md`

## What & Why

Prepare PomoStretch for 100% compliance with 10xDevs certification requirements by eliminating three critical vulnerabilities discovered in pre-submission audit:

1. Reconnecting the domain business logic (`selectExercises`) to the UI island (`ExerciseSequence.tsx`), which currently slices arbitrary database rows.
2. Restoring automated RLS isolation verification (`rls-security.spec.ts`) so the claim on `mvp-submit-checklist.md` is truthful and verifiable.
3. Aligning repository presentation (`README.md`, `package.json`, `mvp-submit-checklist.md`) with the actual application domain.

## Starting Point

The core application flow (Auth -> Pomodoro -> Break Input -> Sequence -> History CRUD) is operational, but:

- `ExerciseSequence.tsx` has dead code: imports neither `selectExercises` nor `getLastSessionIds`, serving `activeCatalog.slice(0, 3)` regardless of user pain input.
- `tests/e2e/rls-security.spec.ts` was deleted in commit `92188a6` because of API test flakiness.
- `README.md` is the generic "10x Astro Starter" stating "No database tables or migrations are required".
- `mvp-submit-checklist.md` references non-existent folder `10xdevs-notes`.

## Desired End State

- User selecting "Tylko kark" receives exercises strictly matching `#neck`, without repeating exercises from the previous break session.
- Playwright E2E suite verifies both the user happy path (US-01 with domain assertions) and tenant data isolation under RLS (User B cannot read/delete User A's break session).
- `README.md` clearly describes PomoStretch, its architecture, Supabase schema, and setup instructions.
- All pre-submission checklist items are truthful and 100% verifiable by human and AI evaluators.

## Key Decisions Made

| Decision                  | Choice                                                                                               | Why                                                                                                     | Source    |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- |
| Exercise Selection Wiring | Wire `selectExercises` in `ExerciseSequence.tsx` initialization                                      | Restores the primary business logic invariant (FR-014, FR-019, FR-022) without touching database schema | Plan      |
| RLS Test Approach         | Standalone Playwright API integration test with deterministic mock UUIDs or sequential user creation | Guarantees RLS verification in CI without UI flakiness                                                  | Plan / M8 |
| E2E Assertion Hardening   | Add tag/body-area check in `tests/e2e/us-01.spec.ts`                                                 | Prevents regression where wrong exercises pass E2E unnoticed                                            | Plan      |
| Documentation Scope       | Rewrite `README.md` and update `package.json` name to `pomostretch`                                  | Eliminates evaluator doubt regarding project completeness                                               | Plan      |

## Scope

**In scope:**

- Connecting `selectExercises()` and `getLastSessionIds()` inside `src/components/ExerciseSequence.tsx`.
- Restoring `tests/e2e/rls-security.spec.ts` with rock-solid reliability.
- Adding domain assertions to `tests/e2e/us-01.spec.ts`.
- Replacing `README.md` with comprehensive PomoStretch documentation.
- Fixing `package.json` name and updating `mvp-submit-checklist.md`.

**Out of scope:**

- Modifying Postgres database migrations or schema.
- Adding complex post-MVP features (LLM routine generation, gamification, calendar sync).
- Changing styling or layout components.

## Phases at a Glance

| Phase                                     | What it delivers                                                                                  | Key risk                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1. Business Logic Reconnection            | `ExerciseSequence.tsx` uses `selectExercises` and respects `breakInput.tags` and `lastSessionIds` | Hydration mismatch or state clearing on refresh |
| 2. Test Suite Hardening & RLS Restoration | Restored `rls-security.spec.ts` + hardened `us-01.spec.ts` with tag assertions                    | Rate-limiting in Supabase auth on CI            |
| 3. Documentation & Metadata Alignment     | Production `README.md`, correct `package.json`, aligned `mvp-submit-checklist.md`                 | Minor markdown typos or broken relative links   |

**Prerequisites:** All existing unit tests green (`npm test` passes).
**Estimated effort:** 1 focused implementation session across 3 phases.

## Success Criteria (Summary)

- Selecting "Tylko kark" in UI displays neck exercises, verifiable in E2E.
- CI pipeline (`npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`) is completely green.
- `README.md` and submission checklist reflect true project state and directory layout.
