<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Final Repo Cleanup Implementation Plan

- **Plan**: `context/changes/final-cleanup/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-11
- **Verdict**: SOUND (after fixes)
- **Findings**: 0 pending (5 fixed)

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS ✅ |
| Lean Execution        | PASS ✅ |
| Architectural Fitness | PASS ✅ |
| Blind Spots           | PASS ✅ |
| Plan Completeness     | PASS ✅ |

## Grounding

Grounding: 5/5 paths ✓, 5/5 symbols ✓, brief↔plan ✓

## Findings

### F1 — Progress↔Phase consistency contract break & missing verification commands

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: `plan.md` — `## Progress` and Phase Success Criteria
- **Detail**: The `## Progress` section lists task numbers (1.1-1.3, 2.1-2.2) instead of matching the Success Criteria bullets from each Phase block as strictly required by `/10x-implement`. Furthermore, Phase 1 automated verification lacks a runnable command.
- **Fix**: Align Success Criteria bullets and Progress checkboxes 1:1 with explicit runnable test commands.
- **Decision**: FIXED (via Fix in plan)

### F2 — Premature deletion of `mvp-submit-checklist.md` in Phase 1

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: `plan.md` — Phase 1, Item 2
- **Detail**: Phase 1 deletes `mvp-submit-checklist.md`, which is the checklist required to verify GitHub secrets, green CI pipeline, live worker deployment, and Supabase migrations before final submission. All checkboxes are currently unchecked.
- **Fix A ⭐ Recommended**: Exclude `mvp-submit-checklist.md` from Phase 1 deletion and keep it until after MVP submission
  - Strength: Preserves the pre-submission guide and verification checklist during MVP review preparation.
  - Tradeoff: Leaves one temporary checklist file in root until final submission.
  - Confidence: HIGH — the file explicitly notes it can be deleted after submitting the project.
  - Blind spot: None significant.
- **Fix B**: Keep deletion in Phase 1, but copy its verification items into `plan.md` manual verification
  - Strength: Keeps root completely clean immediately.
  - Tradeoff: Bloats the final-cleanup plan with full MVP pre-submission verification steps.
  - Confidence: MEDIUM — conflates repo cleanup with submission sign-off.
  - Blind spot: Might be prematurely checked off during cleanup implementation.
- **Decision**: FIXED (via Fix B — added submission checklist verification items to Phase 1 manual verification)

### F3 — Missing Unit & E2E Test Execution in Phase 2

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: `plan.md` — Phase 2 Success Criteria & Progress
- **Detail**: Phase 2 runs `npm update` across Astro 6, React 19, Vite, and Playwright packages, but only tests `npm run lint` and `npm run build`. The plan's Testing Strategy requires unit and E2E tests to pass, but omits `npm test` and `npm run test:e2e` from the automated criteria.
- **Fix A ⭐ Recommended**: Add `npm test` and `npm run test:e2e` to Phase 2 Automated Verification
  - Strength: Guarantees that dependency updates didn't break core runtime behavior or E2E flows before pushing.
  - Tradeoff: Takes an extra ~1-2 minutes during verification.
  - Confidence: HIGH — ensures compliance with Testing Strategy and prevents CI regressions.
  - Blind spot: E2E tests require active test Supabase instance.
- **Fix B**: Drop `npm update` from Phase 2, restricting phase to formatting and linting only
  - Strength: Zero risk of dependency version drift or breaking changes right before submission.
  - Tradeoff: Leaves packages on current pinned versions.
  - Confidence: HIGH — current versions already passed CI.
  - Blind spot: Does not achieve dependency update goal mentioned in brief.
- **Decision**: FIXED (via Fix A — added npm test and npm run test:e2e to Phase 2 Automated Verification)

### F4 — Inaccurate Phase 1 manual verification expectation for gitignored files

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: `plan.md` — Phase 1 Manual Verification
- **Detail**: Phase 1 instructs to `Verify git status shows deleted files`. However, `eslint.log`, `playwright-report/`, `test-results/` are in `.gitignore`, and `ci-logs/` is untracked; `git status` will never report them as deleted.
- **Fix**: Update Phase 1 manual verification to check `git status` for tracked files and a filesystem check for gitignored directories.
- **Decision**: FIXED (via Fix in plan — clarified manual verification for tracked vs gitignored items)

### F5 — Asymmetric AI config file deletion (`KIRO.md` deleted, `CLAUDE.md` kept)

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: `plan.md` — Phase 1, Item 2
- **Detail**: `KIRO.md` is deleted while `CLAUDE.md` and `AGENTS.md` are kept. `KIRO.md` is a 4-line pointer to `AGENTS.md`. If Kiro IDE support is still relevant, keeping it is harmless; if deleted, clarify that Kiro is deprecated in favor of `AGENTS.md`.
- **Fix**: Keep `KIRO.md` alongside `CLAUDE.md` or add a note clarifying why `KIRO.md` is removed while `CLAUDE.md` remains.
- **Decision**: FIXED (via Fix in plan — retained KIRO.md alongside CLAUDE.md)
