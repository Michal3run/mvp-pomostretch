<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Refactor existing E2E tests for 10x compliance (`e2e-compliance-fixes`)

- **Plan**: C:/src/10xDevs/mvp-pomostretch/context/changes/e2e-compliance-fixes/plan.md
- **Scope**: Phase 1 of 1
- **Date**: 2026-09-12
- **Verdict**: REJECTED
- **Findings**: 2 critical 2 warnings 1 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | FAIL    |
| Scope Discipline    | PASS    |
| Safety & Quality    | FAIL    |
| Architecture        | PASS    |
| Pattern Consistency | WARNING |
| Success Criteria    | FAIL    |

## Findings

### F1 — Broken auth form field locators due to English labels and missing hyphens

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: tests/e2e/break-input.spec.ts:12, tests/e2e/rls-security.spec.ts:30, tests/e2e/us-01.spec.ts:15
- **Detail**: All three refactored E2E test files use English exact locators `getByLabel("Email")`, `getByLabel("Password", { exact: true })`, and `getByLabel("Confirm password")`. In `FormField.tsx` and `SignUpForm.tsx`/`SignInForm.tsx`, the actual UI labels are `"E-mail"` (with a hyphen), `"Hasło"`, and `"Potwierdź hasło"`. Because of this mismatch, all three test files time out waiting for form fields, causing `npx playwright test tests/e2e/` to fail completely (exit code 1).
- **Fix**: Replace the rigid English locators with flexible regex patterns supporting both English and Polish labels: `page.getByLabel(/e-?mail/i)`, `page.getByLabel(/hasło|password/i, { exact: false })`, and `page.getByLabel(/potwierdź|confirm/i)`.
- **Decision**: FIXED (Fixed via Fix now)

### F2 — Submit button locator ignores Polish button text in us-01.spec.ts

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/us-01.spec.ts:18,33
- **Detail**: In `us-01.spec.ts`, both signup and signin forms use `page.getByRole("button", { name: /Create account|Sign in/i }).click()`. The actual Polish submit buttons are "Zarejestruj się" and "Zaloguj się". The plan explicitly specified `page.getByRole('button', { name: /Zaloguj|Zarejestruj/i }).click()`, which was correctly implemented in `break-input.spec.ts` and `rls-security.spec.ts`, but drifted in `us-01.spec.ts`.
- **Fix**: Update `us-01.spec.ts` to use `page.getByRole("button", { name: /Zarejestruj|Create account/i })` on signup and `page.getByRole("button", { name: /Zaloguj|Sign in/i })` on signin.
- **Decision**: FIXED (Fixed via Fix now)

### F3 — Rapid loop clicking 'Zrobione' without state transition synchronization

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: tests/e2e/us-01.spec.ts:60
- **Detail**: The while loop was replaced with `for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "Zrobione" }).click(); }`. In a sequence of 3 exercises, each exercise card has a "Zrobione" button. Clicking in a rapid sequential loop without waiting for the exercise transition (or the final completion screen `Świetna robota!`) can cause flakiness if React has not re-rendered the next exercise card before the next click fires.
- **Fix A ⭐ Recommended**: Click and verify transition to next exercise or final completion screen
  - Strength: Guarantees synchronization with UI state transitions on every step.
  - Tradeoff: Adds a couple lines of explicit wait/assertion per iteration.
  - Confidence: HIGH — follows the 10x-e2e principle: wait for state, not time.
  - Blind spot: None significant.
- **Fix B**: Click until the completion screen heading "Świetna robota!" is visible with a bounded timeout
  - Strength: Resilient to sequence length variations.
  - Tradeoff: Similar to the while loop that was removed, though cleaner if structured with Playwright expect.toPass().
  - Confidence: MEDIUM — depends on sequence length remaining 3.
  - Blind spot: May hide sequence progression bugs if skipped.
- **Decision**: FIXED (Fixed via Fix A)

### F4 — Risk header mismatch between R-06 and test-plan.md

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/break-input.spec.ts:1
- **Detail**: Line 1 specifies `// Covers R-06: The quick-pick selection works and starts the exercise flow`. In `context/foundation/test-plan.md`, R-06 is defined as "The no-repeat rule (FR-019) fires the same exercise twice in a row across consecutive breaks within one session", whereas quick-pick selection starting the exercise flow corresponds to R-04.
- **Fix**: Update the header in `tests/e2e/break-input.spec.ts` to `// Covers R-04: Quick-pick selection flow returns exercises and starts sequence`.
- **Decision**: FIXED (Fixed via Fix now)

### F5 — Stale comment referencing removed request interception

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/e2e/break-input.spec.ts:36
- **Detail**: Step 3 comment says `// 3. Click "Zaskocz mnie" and intercept the request to verify parsing`, but the request interception logic was removed as part of the plan.
- **Fix**: Update comment to `// 3. Click "Zaskocz mnie" and verify transition to exercise sequence`.
- **Decision**: FIXED (Fixed via Fix now)
