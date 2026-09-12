<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: PomoStretch Landing Page Redesign

- **Plan**: `context/changes/landing-page-redesign/plan.md`
- **Scope**: Phases 1–3 of 3 (Full Plan)
- **Date**: 2026-09-12
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension           | Verdict    |
| ------------------- | ---------- |
| Plan Adherence      | PASS ✅    |
| Scope Discipline    | PASS ✅    |
| Safety & Quality    | PASS ✅    |
| Architecture        | PASS ✅    |
| Pattern Consistency | PASS ✅    |
| Success Criteria    | WARNING ⚠️ |

## Findings

### F1 — Zero automated E2E coverage for root landing page (`/`)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/`
- **Detail**: Existing Playwright tests (`break-input.spec.ts`, `rls-security.spec.ts`, `us-01.spec.ts`) only navigate directly to `/auth/signup` and `/auth/signin`. None of the automated tests visit `/` or assert that the guest CTAs navigate to auth or that the authenticated CTAs link to `/dashboard` and `/history`.
- **Fix A ⭐ Recommended**: Add a targeted Playwright spec (`tests/e2e/landing-page.spec.ts`) asserting guest hero copy, CTA links, and authenticated state redirection.
  - Strength: Protects the primary marketing funnel against breaking changes during future refactors or CI runs.
  - Tradeoff: ~2-3 seconds added to E2E run.
  - Confidence: HIGH — standard Playwright test following existing project conventions.
  - Blind spot: Requires active dev server.
- **Fix B**: Accept manual verification for static landing page.
  - Strength: Zero maintenance overhead; keeps E2E suite focused strictly on core Pomodoro/Break/History flows.
  - Tradeoff: Regressions on `/` must be caught via manual pre-deploy checks.
  - Confidence: HIGH — landing page is server-rendered static Astro HTML with no client-side state.
  - Blind spot: None critical.
- **Decision**: ACCEPTED (Fix B — landing page verified manually; core user stories US-01 remain fully tested).

### F2 — Bilingual discrepancy between Topbar and Landing Hero

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/components/Topbar.astro:21,31,34`
- **Detail**: `Topbar.astro` displays English labels for unauthenticated / authenticated actions ("Sign in", "Sign up", "Sign out"), whereas the redesigned landing page is written entirely in Polish ("Zacznij za darmo", "Zaloguj się").
- **Fix**: Update `Topbar.astro` labels to Polish ("Zaloguj się", "Zarejestruj", "Wyloguj") or defer to a dedicated localization pass.
- **Decision**: ACCEPTED (Topbar is a shared layout component; modifying it was explicitly out of scope for `landing-page-redesign`).
