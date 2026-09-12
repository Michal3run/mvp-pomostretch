# Implementation Plan: Add landing page e2e test

## Current State Analysis
- The project has Playwright configured and existing E2E tests in tests/e2e/.
- During previous reviews, it was noted that there is no E2E test directly visiting the root path / (the landing page). Existing tests start at /auth/signup.
- The landing page (/) renders a welcome screen with an h1 heading ("Skup sie na kodzie...") and CTA buttons ("Zacznij za darmo").

## Proposed Solution
- Register risk `R-14` in `context/foundation/test-plan.md` ("Unauthenticated visitor opens landing page (/) but hero content or CTA links fail to render, blocking entry into the auth/product flow").
- Add a new E2E spec file `tests/e2e/landing-page.spec.ts` with header `// Covers R-14: Landing page rendering and unauthenticated entry flow`.
- The test will assert basic rendering, the presence of key Call to Action (CTA) elements, and verify navigation to `/auth/signup` upon clicking the primary CTA.
- The test will run on the desktop viewport only, as agreed.
- It will verify the unauthenticated state specifically (checking for the "Zacznij za darmo" link).

## Phase 1: Landing Page E2E Test

### Changes
- Update `context/foundation/test-plan.md`:
  - Register `R-14` in the Risk Register table.
- Create `tests/e2e/landing-page.spec.ts`:
  - Add `// Covers R-14: Landing page rendering and unauthenticated entry flow` comment at top.
  - Import `test` and `expect` from `@playwright/test`.
  - Write test block for landing page rendering and CTA link.
  - Navigate to `/`.
  - Assert page title contains "PomoStretch".
  - Assert main heading (`getByRole('heading', { level: 1 })`) is visible.
  - Assert main CTA (`getByRole('link', { name: /Zacznij za darmo/i })`) is visible.
  - Click the main CTA link.
  - Assert navigation to `/auth/signup` (`await expect(page).toHaveURL(/\/auth\/signup/)`).
  - Assert signup form is visible (`await expect(page.locator('form')).toBeVisible()`).

#### Automated Verification:
- `npx playwright test tests/e2e/landing-page.spec.ts`

## Open Risks & Assumptions
- The test assumes an unauthenticated session by default.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` â€” <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Landing Page E2E Test

#### Automated

- [x] 1.1 Implement E2E test for the landing page (tests/e2e/landing-page.spec.ts) — 14177a6


