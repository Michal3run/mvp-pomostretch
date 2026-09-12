<!-- PLAN-REVIEW-REPORT -->

# Plan Review: PomoStretch Landing Page Redesign Implementation Plan

- **Plan**: `context/changes/landing-page-redesign/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-12
- **Verdict**: SOUND
- **Findings**: 0 critical, 2 warnings, 1 observation

## Verdicts

| Dimension             | Verdict    |
| --------------------- | ---------- |
| End-State Alignment   | PASS ✅    |
| Lean Execution        | PASS ✅    |
| Architectural Fitness | PASS ✅    |
| Blind Spots           | WARNING ⚠️ |
| Plan Completeness     | WARNING ⚠️ |

## Grounding

Grounding: 5/5 paths ✓, 3/3 symbols ✓, brief↔plan ✓

## Findings

### F1 — Duplicate Progress Checkbox ID in Phase 2

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: `plan.md` — `## Progress` line 192
- **Detail**: In `## Progress`, Phase 2 lists two items with ID `2.2`: `- [x] 2.2 Astro build succeeds via npm run build` and `- [x] 2.2 3-step workflow and 4-card feature grid display cleanly across viewports`. Sequential numbering requires `2.3` for the manual verification item.
- **Fix**: Renumber `- [x] 2.2 3-step workflow...` to `2.3` in `plan.md`.
- **Decision**: FIXED (via Fix in plan)

### F2 — Automated E2E verification does not exercise the root landing page

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: `plan.md` — Phase 3 Automated Verification (`npm run test:e2e`)
- **Detail**: Phase 3 lists `npm run test:e2e` as automated verification, but existing Playwright suites (`tests/e2e/*.spec.ts`) only test `/auth/signup`, `/auth/signin`, and post-auth flows. No test visits `/` to assert hero copywriting, guest vs authenticated CTA state, or navigation links.
- **Fix A ⭐ Recommended**: Add a targeted E2E test in `tests/e2e/landing-page.spec.ts` testing guest CTAs and authenticated state transition.
  - Strength: Prevents regressions on the main acquisition funnel during future refactors or CI runs.
  - Tradeoff: Additional test execution time (~2s).
  - Confidence: HIGH — standard Playwright test following existing project conventions.
  - Blind spot: Requires local dev server / test Supabase instance for auth verification.
- **Fix B**: Accept manual verification for landing page UI and keep automated tests scoped to core user stories (US-01).
  - Strength: Keeps test suite lean and fast.
  - Tradeoff: Landing page regressions must be caught manually before deployment.
  - Confidence: HIGH — page is purely static Astro SSR with no complex client state.
  - Blind spot: None critical.
- **Decision**: ACCEPTED (Fix B — landing page is verified manually; core user stories US-01 covered)

### F3 — HTML `lang="en"` attribute on Polish-copy landing page

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: `src/layouts/Layout.astro:14`
- **Detail**: `Layout.astro` hardcodes `<html lang="en">`, while the redesigned landing page is in Polish. Screen readers and search engine indexing may default to English pronunciation and linguistic rules.
- **Fix**: Add an optional `lang` prop to `Layout.astro` defaulting to `"pl"` or pass `lang="pl"` from `src/pages/index.astro`.
- **Decision**: ACCEPTED (Known limitation inherited from starter scaffold)
