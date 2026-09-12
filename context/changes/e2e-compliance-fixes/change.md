---
change_id: e2e-compliance-fixes
title: Refactor existing E2E tests for 10x compliance
status: implemented
created: 2026-09-12
updated: 2026-09-12
archived_at: null
---

## Notes

Refactor us-01.spec.ts, break-input.spec.ts, and rls-security.spec.ts to comply with 10x-e2e rules: use accessibility locators, fix test isolation/flakiness, map to test-plan.md risks, and assert on UI outcomes instead of intercepting network requests.

