---
project: PomoStretch
version: 1
status: draft
created: 2026-06-08
updated: 2026-06-08
context_type: greenfield
owner: solo
test_framework: undecided # decided later in M2 (planning) / M3+ lessons; placeholders below
---

# Test Plan — PomoStretch

> **Scope of this document.** This is the *plan* — risks the product can fail on, and the tests we will write to address each one. Test code is **not** implemented at the time of writing this file; it will land incrementally as later course lessons introduce the test stack and as changes ship. Course requirement: *"at least one test verifying functionality from the user's perspective, addressing a risk defined in test-plan."* This file is the contract that future test code points back at.

## Purpose & non-purpose

**Purpose.** Make the failure modes of the MVP explicit before a single test exists, so that:

1. When test code lands, every test points to a numbered risk in this document — not the other way around. No test exists "because frameworks expect it"; each one defends a real failure.
2. When deciding what to test first under a tight budget, priority is read off the risk table, not from gut feel.
3. When evaluators grade the project, the chain *risk → test → green CI* is one document apart — `test-plan.md → tests/ → .github/workflows/ci.yml`.

**Non-purpose.** This file does **not** specify test infrastructure choices (Vitest vs Playwright vs Astro+container tests), test file layout, fixtures, or CI matrix. Those are picked when the test stack is selected (likely M2L3–M2L4 / M3+) and recorded in a future `context/foundation/test-stack.md` (or extended here once chosen). Until then, the **Tooling slot** column below holds `TBD` and a hint, not a binding choice.

## How risks were derived

Each risk traces to one of:

- A **Guardrail** in PRD `## Success Criteria` (G1 latency, G2 user agency, G3 timer durability) — these are the explicit failure modes the product team flagged.
- An **NFR** in PRD `## Non-Functional Requirements` (NFR-1..5 are MVP-mandatory; NFR-6..9 are post-MVP and out of test scope here).
- A **business-logic invariant** from PRD `## Business Logic` and FR-019/FR-021/FR-022 (no-repeat, tag match, non-empty result).
- An **access-control invariant** from PRD `## Access Control` and FR-004 (gated routes).
- A **data-integrity invariant** introduced by the `session-history-crud` change (user can read/update/delete *only their own* `break_session` rows — RLS).

Risks the MVP **does not test** (and why):

- Pain-extraction LLM endpoint behavior (NFR-6/7/8/9) — feature is post-MVP, no code to test yet.
- Browser-matrix manual checks (NFR-5) — covered by manual sanity pass on Chrome+Firefox at submission, not automated. Adding a Playwright matrix is a post-cert nice-to-have.
- Visual regression / styling — out of scope for a solo MVP.
- Load / stress / multi-user concurrency — single-user scale per `target_scale.users: small`.

## Risk register

Severity scale: **High** = breaks the core demo flow or a course-mandatory element; **Med** = degrades a guardrail or an NFR but flow still demoable; **Low** = polish / edge case.

Test-type vocabulary:

- **E2E** — full user flow through the rendered UI (browser-driven, e.g. Playwright).
- **Integration** — API route + DB + auth wired together, no browser (e.g. Vitest hitting Astro endpoints with a Supabase test instance, or the equivalent in the chosen stack).
- **Unit** — pure function in isolation (rule engine, keyword matcher).
- **Manual** — checklist run against staging at submission time; documented, not automated.

| ID | Risk (what fails for the user) | Source | Severity | Test type | Tooling slot | Order |
|---|---|---|---|---|---|---|
| R-01 | An unauthenticated visitor reaches `/dashboard` (or any gated route) and sees app content instead of being redirected to `/auth/signin`. | PRD `## Access Control`, FR-004 | High | Integration | TBD (route handler + middleware test) | 1 |
| R-02 | A signed-in user opens "Historia przerw" and sees `break_session` rows belonging to **another** user (RLS / authorization bug). | `session-history-crud` change, course req #1 + #2 | High | Integration | TBD (Supabase RLS test or API test with two users) | 1 |
| R-03 | The full happy-path cycle (sign-in → start work → end early → quick-pick "Tylko kark" → see ≥1 neck-tagged exercise → mark Done → "Resume work?") cannot be completed end-to-end in a fresh browser session. This is **the** demo story. | PRD `## Success Criteria` Primary, US-01 | High | E2E | TBD (Playwright or equivalent) | 1 |
| R-04 | The exercise selection rule returns an **empty** sequence for any of the 4 quick-pick options (`Tylko oczy`, `Tylko kark`, `Ogólne`, `Zaskocz mnie`) given the seed catalog. | FR-022 robustness, PRD `## Success Criteria` Secondary | High | Unit (rule engine) + Integration (catalog seed) | TBD | 1 |
| R-05 | A `break_session` row created by user A can be read / updated / deleted by user B via a direct API call (CRUD authorization, not just UI hiding). | `session-history-crud` change | High | Integration (API + Supabase RLS) | TBD | 1 |
| R-06 | The no-repeat rule (FR-019) fires the same exercise twice in a row across consecutive breaks within one session — when the immediately preceding break-session has been persisted to DB. | FR-019 + `session-history-crud` change | Med | Unit (rule engine fed with a stub `last_session`) | TBD | 2 |
| R-07 | Free-text input that doesn't match any keyword causes an empty / error state instead of falling back to the `general` tag. | FR-012 graceful fallback | Med | Unit (keyword matcher) | TBD | 2 |
| R-08 | An active 25-minute work-timer is lost on page refresh (G3 — pomodoro state durability via localStorage). | NFR-2 / Guardrail G3 | Med | E2E (refresh mid-timer) **or** Manual checklist | TBD | 2 |
| R-09 | First exercise in the break flow takes > 1.5s to be visible after quick-pick tap (NFR-1 break-content delivery). | NFR-1 / Guardrail G1 | Med | E2E with a perf budget assertion **or** Manual measurement | TBD | 3 |
| R-10 | Skip / Done at any point in the exercise sequence breaks the flow (state machine bug — sequence stuck, prompt never appears). | Guardrail G2, FR-016/FR-017 | Med | E2E (run the sequence with all-Skip and all-Done permutations) | TBD | 3 |
| R-11 | A user signs up with valid email + password, then immediately cannot sign in (auth integration regression). | FR-001..FR-002 | Med | Integration (sign-up + sign-in round-trip against Supabase test instance) | TBD | 3 |
| R-12 | Password storage leaks plaintext (logs, error message, network response). NFR-3. | NFR-3 password opacity | Low (verifying Supabase Auth, not our own crypto) | Manual review of network/logs at submission; one assertion-style integration test that POST /api/auth/signup response body does not contain the password substring | TBD | 4 |
| R-13 | DELETE on a `break_session` returns success but the row remains in DB (silent data-integrity bug). | `session-history-crud` change | Low | Integration (DELETE then GET, expect 404) | TBD | 4 |

## Minimum-viable test set for certification

The course requires "at least one test, verifying functionality from the user's perspective, addressing a risk in test-plan". To certify with the lowest-risk margin, the **first test to land** should be one of:

- **R-03** — full E2E happy-path cycle (covers user-perspective + business logic + auth in one). **Recommended primary.**
- **R-04** — rule-engine unit test on FR-022 robustness for all 4 quick-picks (covers business logic + risk #1 evaluator looks for: no empty CRUD).

Either alone satisfies the course minimum. Shipping both is cheap and doubles defense.

The next layer — once the test stack is set up — addresses **R-01, R-02, R-05** (access control + CRUD authorization on the new `break_session` entity). After that, Order 2 risks. Order 3+ is post-cert polish.

## Test-stack decision (deferred)

The framework + runner choice is deferred to the lesson where it becomes a learning objective (M2L3 implementation, or later in M3+). Likely candidates given the locked tech stack:

- **E2E** — Playwright (works against `astro preview` or deployed CF Pages preview; matches what most JS courses default to).
- **Integration** — Vitest (already in the Astro ecosystem; can hit API routes via fetch or import the route handlers directly).
- **Unit** — Vitest, same runner as integration.
- **Supabase test instance** — `supabase start` for local Postgres, or a separate dev project; RLS rules run identically.
- **CI integration** — Add a `test` job to `.github/workflows/ci.yml` next to existing `lint` + `build`. Wire it after `build` so red tests block merge.

When the stack is selected, this section is replaced by a real `## Tooling` block, the **Tooling slot** column above is filled in, and a `context/foundation/test-stack.md` is written if the configuration grows beyond a paragraph.

## Update protocol

- A new functional risk → append a row to the register (next free `R-NN`), assign Severity + Order, point to source (PRD section / FR / NFR / change folder).
- A risk is fully addressed (test green in CI for ≥ 1 week) → keep the row, change Order to `done`, do not delete (audit trail).
- A risk is no longer applicable (feature dropped, NFR re-scoped) → keep the row, set Severity to `n/a` and add a one-line note in `## Update protocol` history below.

### History

- `2026-06-08` — initial draft (13 risks). No tests implemented yet — see `## Test-stack decision (deferred)`.
