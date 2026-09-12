# MVP Pre-Submission Remediation Implementation Plan

## Overview

Remediate critical quality and certification blockers identified during the pre-submission review of PomoStretch. The objective is to ensure 100% compliance with the 10xDevs evaluation rubric (`.ai/prompts/mvp-check.md`), guarantee that domain business logic is actively executed in the application, and eliminate any discrepancies between documentation and implementation.

## Current State Analysis

1. **Disconnected Business Logic**: `src/lib/rule-engine.ts` exports `selectExercises()`, which properly filters exercises by user tags, respects no-repeat history (`lastSessionIds`), and guarantees ≥1 result via fallbacks (FR-014, FR-019, FR-022). Vitest tests in `src/lib/rule-engine.test.ts` are 100% green. However, `src/components/ExerciseSequence.tsx` initializes state with `const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG; return activeCatalog.slice(0, 3);`. The domain rule engine is completely dead code in the UI runtime.
2. **Missing Security Test for Checklist Claim**: `mvp-submit-checklist.md` claims: _"security rules (RLS) are verified via API integration tests"_. However, `tests/e2e/rls-security.spec.ts` was deleted in commit `92188a6` to bypass CI flakiness. The repository currently has only one E2E test (`us-01.spec.ts`), leaving RLS isolation unverified by automated tests.
3. **Weak E2E Assertion**: `tests/e2e/us-01.spec.ts` clicks "Tylko kark", but never verifies that any rendered exercise actually targets the neck. It only checks for button visibility (`Zrobione`), masking the dead code bug described above.
4. **Starter Kit README & Metadata**: `README.md` is titled `# 10x Astro Starter` and explicitly says _"No database tables or migrations are required — this project uses Supabase Auth's built-in auth.users table only."_ This directly contradicts the 8 PostgreSQL migrations in `supabase/migrations/`. In `package.json`, the package name is `"10x-astro-starter"`.
5. **Phantom Folder Reference**: `mvp-submit-checklist.md` directs evaluators to `10xdevs-notes`, a directory that does not exist (all artifacts are in `context/foundation/`).

## Desired End State

1. **Active Rule Engine**: When a user selects a pain area (e.g. "Tylko kark") or types free text ("boli mnie kark"), `ExerciseSequence.tsx` executes `selectExercises()` with `breakInput.tags`, `getLastSessionIds()`, and `catalog`. Only relevant exercises are shown, without repeating exercises from the previous break.
2. **Deterministic RLS Security Test**: `tests/e2e/rls-security.spec.ts` is restored as a reliable, non-flaky integration test ensuring User B cannot read or delete User A's break session records.
3. **Hardened E2E Test**: `tests/e2e/us-01.spec.ts` asserts that at least one exercise card displays a neck-related badge or title.
4. **Professional Documentation**: `README.md` introduces PomoStretch, documents the tech stack, database schema, and Cloudflare deployment steps. `mvp-submit-checklist.md` points to `context/foundation/`.

### Key Discoveries:

- `src/lib/session-storage.ts:L3-L13`: `getLastSessionIds()` is already fully implemented and unit-ready, waiting to be consumed.
- `src/components/ExerciseSequence.tsx:L7-L9`: `saveLastSessionIds` is imported and called at completion, but `getLastSessionIds` was never imported.
- `context/foundation/test-plan.md:L58`: Risk `R-03` specifically requires: _"quick-pick 'Tylko kark' -> see >=1 neck-tagged exercise -> mark Done"_.
- `supabase/migrations/20260715120100_create_break_session_table.sql`: Strict RLS policies exist on `break_session` for SELECT, INSERT, UPDATE, DELETE with `auth.uid() = user_id`.

## What We're NOT Doing

- Not rewriting the rule engine (`selectExercises` logic in `src/lib/rule-engine.ts` is already verified and correct).
- Not altering the Supabase schema or creating new SQL migrations.
- Not implementing optional post-MVP features (LLM routines, gamification, calendar integrations).
- Not refactoring working Astro pages or shadcn/ui components.

## Implementation Approach

Follow the 10xDevs discipline:

- Make changes in 3 targeted phases with clear contracts and automated verification.
- Maintain full test greenness across Vitest, Playwright, and ESLint.
- Verify both the happy path and tenant security before finalizing.

## Critical Implementation Details

- **React Island Hydration**: In `src/components/ExerciseSequence.tsx`, `localStorage` is browser-only (`typeof window !== "undefined"`). The initial state or `useEffect` must handle the transition without SSR hydration mismatches. `getStoredExerciseState()` already has an `isMounted` guard; exercise selection must occur either on initial client render or when `storedState` is not found.
- **Playwright Test User Isolation**: In `tests/e2e/rls-security.spec.ts`, avoid using hardcoded UUIDs in `selected_exercise_ids` that violate foreign or format constraints. Ensure valid UUID format (`crypto.randomUUID()`) and sequential auth context creation so Supabase does not rate-limit user signups.

---

## Phase 1: Business Logic Reconnection

### Overview

Connect `selectExercises()` and `getLastSessionIds()` inside `src/components/ExerciseSequence.tsx` so that user pain input actively determines the exercise routine and respects no-repeat session history.

### Changes Required:

#### 1. Exercise Sequence Component

**File**: `src/components/ExerciseSequence.tsx`
**Intent**: Import `selectExercises` from `@/lib/rule-engine` and `getLastSessionIds` from `@/lib/session-storage`. When initializing the exercise list (and no valid saved in-progress exercise state exists in `localStorage`), run `selectExercises({ tags: breakInput.tags, lastSessionIds: getLastSessionIds(), catalog: activeCatalog })` instead of arbitrary slicing.
**Contract**:

- Must preserve fallback behavior if `catalog` is empty.
- Must preserve state persistence in `exercise-storage` (reloading the page mid-routine keeps the selected exercises).
- Selected exercises must be passed to `saveLastSessionIds()` on completion (already implemented).

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test`
- Linter passes without warnings: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Launch dev server, complete a Pomodoro, select "Tylko kark", and verify that neck exercises appear.
- Select "Tylko oczy" in a subsequent run and verify eye exercises appear.

---

## Phase 2: RLS Security Test Restoration & E2E Assertion Hardening

### Overview

Restore automated multi-tenant security verification and harden the E2E happy path test to verify domain decisions.

### Changes Required:

#### 1. Happy Path E2E Test

**File**: `tests/e2e/us-01.spec.ts`
**Intent**: Add assertion verifying that when "Tylko kark" is selected, the rendered exercise card contains `#kark` or neck-related text before proceeding to click "Zrobione".
**Contract**:

- Check that `page.getByText("#kark")` or `page.locator("text=/kark|szyj/i")` is visible during step 7.

#### 2. RLS Security Integration Test

**File**: `tests/e2e/rls-security.spec.ts`
**Intent**: Restore the test verifying that User B cannot view (via `GET /api/session-history`) or delete (via `DELETE /api/session-history/:id`) break sessions belonging to User A.
**Contract**:

- Use unique timestamp-based credentials for User A and User B.
- Use valid generated UUIDs for `selected_exercise_ids`.
- Assert User B gets an empty list from `GET /api/session-history`.
- Assert User B receives 404 when attempting `DELETE /api/session-history/${userASessionId}`.

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test`
- Playwright E2E suite passes completely: `npm run test:e2e`
- Linter passes: `npm run lint`

#### Manual Verification:

- Confirm CI workflow passes with both `us-01.spec.ts` and `rls-security.spec.ts`.

---

## Phase 3: Documentation & Repository Metadata Alignment

### Overview

Align all repository metadata, project descriptions, and submission checklists with the real PomoStretch application.

### Changes Required:

#### 1. README Documentation

**File**: `README.md`
**Intent**: Replace the generic "10x Astro Starter" documentation with a complete PomoStretch project README, describing the product purpose, architecture, Supabase schema & migrations, Cloudflare Workers deployment, and local setup.
**Contract**:

- Project title: `# PomoStretch`.
- Remove claim that no database or migrations are required.
- Document migration commands and test commands.

#### 2. Package Metadata

**File**: `package.json`
**Intent**: Update `"name": "10x-astro-starter"` to `"name": "pomostretch"`.
**Contract**:

- Valid JSON format.

### Success Criteria:

#### Automated Verification:

- Linter passes: `npm run lint`
- Build passes: `npm run build`

#### Manual Verification:

- Review `README.md` for clarity and factual accuracy.

---

## Testing Strategy

### Unit Tests:

- `src/lib/rule-engine.test.ts`: Continues to verify tag matching, ascending duration sorting, fallback rules, and no-repeat behavior.

### Integration / E2E Tests:

- `tests/e2e/us-01.spec.ts`: End-to-end user story verification (Signup -> Pomodoro Session -> Break Selection -> Neck Exercise Sequence -> Done -> Resume Work).
- `tests/e2e/rls-security.spec.ts`: Multi-tenant isolation at the database API layer.

## References

- Evaluator rubric: `.ai/prompts/mvp-check.md`
- Test plan: `context/foundation/test-plan.md`
- PRD: `context/foundation/prd.md`
- Original M4 change: `context/changes/m4-exercise-selection/change.md`

---

## Review Amendments (applied during implementation)

Fixes from plan review that deviated from the original plan:

1. **Fallback exercise IDs**: Changed `"fb-1"`, `"fb-2"` to valid UUIDs (`"00000000-0000-4000-a000-000000000001"`, `"00000000-0000-4000-a000-000000000002"`) — original IDs would fail `z.string().uuid()` validation on `POST /api/session-history` and the `uuid[]` column constraint on `break_session`.
2. **Hydration safety**: Exercise selection explicitly runs in `useEffect` (client-only), not in `useState` initializer — `getLastSessionIds()` reads `localStorage` and `selectExercises()` uses `Math.random()`, both of which cause SSR/client hydration mismatch.
3. **Second dead-code callsite**: Fixed `useEffect` fallback branch (L96-98 in original) that also used `catalog.slice(0, 3)` — this would have become the primary initialization path after the `useState` change.
4. **E2E assertion**: Used `text=/kark|szyj/i` regex on visible card text instead of `#kark` hashtag (no exercises have `#kark` in their UI text).

## Progress

### Phase 1: Business Logic Reconnection

#### Automated

- [x] 1.1 Unit tests pass via npm test
- [x] 1.2 Linter passes without warnings via npm run lint
- [x] 1.3 Production build succeeds via npm run build

#### Manual

- [ ] 1.4 Launch dev server, complete a Pomodoro, select "Tylko kark", and verify that neck exercises appear
- [ ] 1.5 Select "Tylko oczy" in a subsequent run and verify eye exercises appear

### Phase 2: RLS Security Test Restoration & E2E Assertion Hardening

#### Automated

- [x] 2.1 Unit tests pass via npm test
- [x] 2.2 Playwright suite passes via npm run test:e2e
- [x] 2.3 Linter passes via npm run lint

#### Manual

- [ ] 2.4 Verify test execution logs show both us-01 and rls-security passing cleanly

### Phase 3: Documentation & Repository Metadata Alignment

#### Automated

- [x] 3.1 Linter passes via npm run lint
- [x] 3.2 Build passes via npm run build

#### Manual

- [x] 3.3 Verify README.md reflects exact repository layout and no phantom paths
