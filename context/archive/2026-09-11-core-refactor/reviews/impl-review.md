<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Core Clean Code Refactor (`core-refactor`)

- **Plan**: C:/src/10xDevs/mvp-pomostretch/context/changes/core-refactor/plan.md
- **Scope**: Phase 1 of 2
- **Date**: 2026-09-12
- **Verdict**: NEEDS ATTENTION
- **Findings**: 1 critical 1 warnings 0 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | WARNING |
| Safety & Quality    | FAIL    |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | PASS    |

## Findings

### F1 — Stale closure causing incorrect session stats (off-by-one)

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/components/hooks/useExerciseSequence.ts:121
- **Detail**: In `advanceNext`, `setCompletedCount` or `setSkippedCount` is called right before calling `finishSequence(exercises)`. Since React state updates are asynchronous, `finishSequence` reads the stale values of `completedCount` and `skippedCount` from its closure. The final exercise of the sequence will not be included in the stats sent to `/api/session-history`.
- **Fix**: Update `finishSequence` to accept `finalCompleted` and `finalSkipped` counts as arguments, and calculate them in `advanceNext` before calling.
  - Strength: Fixes the bug locally without changing the state architecture, avoiding `useRef`.
  - Tradeoff: Minor — changes the signature of `finishSequence` inside the hook.
  - Confidence: HIGH — standard fix for stale closures in React.
  - Blind spot: None significant.
- **Decision**: FIXED (Fixed via Fix now)

### F2 — Unplanned parser extraction

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/lib/break-input-parser.ts
- **Detail**: Extracted `break-input-parser.ts` and `break-input-keywords.ts` from `break-input.ts`. This is a solid architectural improvement, but it wasn't listed in the plan, violating scope discipline.
- **Fix ⭐ Recommended**: Document in the plan as an addendum
  - Strength: Preserves the good work while correcting the source of truth.
  - Tradeoff: Plan becomes a slightly moving target.
  - Confidence: HIGH — standard procedure for discovered scope.
  - Blind spot: None significant.
- **Decision**: FIXED (Fix now)
