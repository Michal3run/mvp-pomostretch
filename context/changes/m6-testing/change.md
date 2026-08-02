---
change_id: m6-testing
status: implemented
created: 2026-08-01
owner: solo
type: cross-cutting
blocks_certification: true
related_prd_sections:
  - "## Verification & Testing"
related_risks: [R-01, R-02, R-03, R-04, R-05, R-13]
---

# Milestone 6: Testing & Certification (`m6-testing`)

> **One-line summary.** Establish automated testing suite (Vitest for unit/integration tests and Playwright for E2E user flow tests) validating US-01, authentication access control, RLS policies, and rule engine robustness.

## Key Deliverables

1. **Unit & Integration Tests (Vitest)**:
   - Rule engine tag mapping, fallback, and no-repeat logic tests (`tests/unit/rule-engine.test.ts`).
   - Session history schema validation & RLS policy tests (`tests/integration/session-history-api.test.ts`).

2. **End-to-End Tests (Playwright)**:
   - Full pomodoro cycle E2E test (`tests/e2e/pomodoro-flow.spec.ts`): Sign in → Pomodoro dashboard → Break input → Exercise sequence → Done/Skip → History record.

3. **CI Pipeline Integration**:
   - Running test suite on pull requests and main branch deployments.
