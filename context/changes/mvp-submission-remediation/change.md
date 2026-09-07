---
change_id: mvp-submission-remediation
status: planned
created: 2026-09-05
updated: 2026-09-05
owner: solo
type: fix
blocks_certification: true
related_prd_sections:
  - "## Business Logic / Rule Engine"
  - "## Access Control"
  - "## Success Criteria"
related_frs: [FR-014, FR-019, FR-022, FR-023, FR-027]
---

# Change: MVP Pre-Submission Remediation (`mvp-submission-remediation`)

> **One-line summary.** Fix critical blockers for 10xDevs certification: reconnect dead-code business logic (`selectExercises`) in `ExerciseSequence.tsx`, restore and de-flake RLS security integration tests, harden E2E assertions, and replace starter-kit README/metadata with production documentation.

## Context & Motivation

During final pre-submission audit against the official 10xDevs evaluator criteria (`.ai/prompts/mvp-check.md`), three critical blockers were discovered:

1. **Business logic is disconnected in UI**: `selectExercises` exists in `src/lib/rule-engine.ts` with passing unit tests, but `src/components/ExerciseSequence.tsx` uses `activeCatalog.slice(0, 3)`, completely ignoring user input tags (`eyes`, `neck`, etc.) and the no-repeat history (`getLastSessionIds`).
2. **Missing RLS verification test**: `mvp-submit-checklist.md` claims RLS is verified via automated API tests, but `tests/e2e/rls-security.spec.ts` was deleted in commit `92188a6` due to flakiness.
3. **Template documentation**: `README.md` and `package.json` are still the default "10x Astro Starter", stating that no database or migrations exist, conflicting directly with the real schema and PRD.

## Deliverables

1. **ExerciseSequence.tsx Reconnection**: Connect `selectExercises()` and `getLastSessionIds()` to ensure domain decision-making actually drives the exercise sequence.
2. **RLS Security Test Restoration**: Restore `tests/e2e/rls-security.spec.ts` as a reliable Playwright API integration test without flakiness.
3. **E2E Test Hardening**: Add assertions to `tests/e2e/us-01.spec.ts` verifying that exercises rendered after selecting "Tylko kark" actually have the `neck` body area.
4. **Documentation Alignment**: Replace `README.md` with PomoStretch documentation, fix project name in `package.json`, and correct phantom paths in `mvp-submit-checklist.md`.
