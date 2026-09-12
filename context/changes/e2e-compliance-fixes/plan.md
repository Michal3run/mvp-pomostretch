# Implementation Plan: E2E Compliance Fixes

## Current State Analysis
Existing E2E tests (us-01.spec.ts, break-input.spec.ts, rls-security.spec.ts) violate several /10x-e2e rules:
1. They use brittle CSS locators.
2. break-input.spec.ts hallucinates by asserting network payload instead of UI outcome.
3. break-input.spec.ts and rls-security.spec.ts are missing // Covers R-XX risk mapping headers.
4. rls-security.spec.ts calculates suffix = Date.now() at the describe scope, causing flakiness on retries.
5. us-01.spec.ts uses an unstable while loop with isVisible() checking.

## Proposed Solution
- Refactor all CSS locators to use getByRole or getByLabel.
- Update break-input.spec.ts to assert that the exercise sequence renders properly instead of intercepting POST requests. Add risk mapping (R-06).
- Update rls-security.spec.ts to map to its risk (R-05). Move suffix generation to test.beforeAll to ensure it's evaluated on retry but shared across serial tests.
- Update us-01.spec.ts to replace the while loop with deterministic steps (click "Zrobione" 3 times).

## Phase 1: Refactor Selectors & Flakiness

### Changes
- **tests/e2e/us-01.spec.ts**:
  - Replace page.fill('input[name="email"]') with page.getByLabel(/email/i).fill().
  - Replace page.click('button[type="submit"]') with page.getByRole('button', { name: /Zaloguj|Zarejestruj/i }).click().
  - Remove the brittle while loop. Click "Zrobione" exactly 3 times (the standard sequence length) or until the success screen appears using a robust locator.
- **tests/e2e/rls-security.spec.ts**:
  - Add // Covers R-05 header.
  - Move suffix generation into test.beforeAll().
  - Replace CSS selectors for login/signup with getByRole/getByLabel.
- **tests/e2e/break-input.spec.ts**:
  - Add // Covers R-06 header (or R-04 if it's the quick-pick test).
  - Remove page.waitForRequest(...) and expect(postData).
  - Replace CSS selectors for login/signup.

#### Automated Verification
- npx playwright test tests/e2e/

## Progress

> Convention: - [ ] pending, - [x] done. Append  — <commit sha> when a step lands. Do not rename step titles.

### Phase 1: Refactor Selectors & Flakiness

#### Automated

- [ ] 1.1 Refactor E2E tests for 10x compliance
