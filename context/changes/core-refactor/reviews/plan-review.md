<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Core Refactor — Rule Engine Pipeline & ExerciseSequence Hook

- **Plan**: `context/changes/core-refactor/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-11
- **Verdict**: SOUND (after fixes)
- **Findings**: 5 (2 critical, 2 warnings, 1 observation)

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS ✅ |
| Lean Execution        | PASS ✅ |
| Architectural Fitness | PASS ✅ |
| Blind Spots           | FAIL ❌ |
| Plan Completeness     | FAIL ❌ |

## Grounding

Grounding: 6/6 paths ✓, 4/4 symbols ✓, brief↔plan ✓

**Paths verified:**

- `src/lib/rule-engine.ts` — exists (67 lines), confirms nested if/else (L33–50) and `sort(() => 0.5 - Math.random())` (L58) ✓
- `src/lib/rule-engine.test.ts` — exists (81 lines, 8 tests) ✓
- `src/components/ExerciseSequence.tsx` — exists (453 lines), confirms 12× `useState`, 2 timers, inline `formatSeconds`, 2 API calls ✓
- `src/lib/time-utils.ts` — does NOT exist (creation is correct) ✓
- `src/lib/time-utils.test.ts` — does NOT exist (creation is correct) ✓
- `src/components/hooks/useExerciseSequence.ts` — does NOT exist, directory `hooks/` also absent (creation is correct per AGENTS.md: _"Extract hooks to `src/components/hooks/`"_) ✓

**Symbols verified:**

- `selectExercises` in `rule-engine.ts` ✓
- `fisherYatesShuffle<T>` — does NOT exist yet (plan creates it) ✓
- `formatDuration` — does NOT exist yet (plan creates it) ✓
- `ExerciseSequence` default export in `ExerciseSequence.tsx` ✓

**Brief↔Plan alignment:** The brief's three main change areas (rule engine pipeline, hook extraction, time-utils) are all represented in the plan's two phases. The brief's success criteria (`npm test` green, `npm run lint` clean, `ExerciseSequence.tsx` < 160 lines, 100% timer/formatting test coverage) are reflected in the plan's success criteria. ✓

## Findings

### F1 — Progress checkboxes don't match Success Criteria 1:1

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: `plan.md` — `## Progress` vs Phase Success Criteria
- **Detail**: The Progress section uses generic task descriptions (e.g. "1.1 Wdrożenie pipeline'u fallbacków…", "2.2 Utworzenie hooka…") instead of matching Success Criteria bullets verbatim. The `/10x-implement` skill requires 1:1 correspondence between Progress checkboxes and Success Criteria, with each checkbox representing a verifiable automated or manual gate. Additionally, several criteria from the brief are missing from the plan's progress: `npm run lint` without errors, timer logic 100% test coverage, and `ExerciseSequence.tsx` line count < 160 check.
- **Fix**: Rewrite the `## Progress` section so each `- [ ]` maps 1:1 to a Success Criteria bullet, including runnable verification commands. For example:
  - `- [ ] All unit tests rule-engine.test.ts pass: npm test -- --reporter verbose`
  - `- [ ] No conditional nesting > 1 level in rule-engine.ts`
  - `- [ ] time-utils.test.ts passes: npm test -- --reporter verbose`
  - `- [ ] ExerciseSequence.tsx < 160 lines: wc -l src/components/ExerciseSequence.tsx`
  - `- [ ] npm test passes (full suite, no regressions)`
  - `- [ ] npm run lint passes without errors`
- **Decision**: FIXED (Updated Progress section with 1:1 runnable verification items)

### F2 — Missing `FALLBACK_EXERCISE_CATALOG` relocation strategy

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: `plan.md` — Phase 2, `ExerciseSequence.tsx` refactoring
- **Detail**: `ExerciseSequence.tsx` (lines 21–38) defines a hardcoded `FALLBACK_EXERCISE_CATALOG` constant (2 exercises, 17 lines). The plan says the component should become a "clean presentation layer" under 160 lines, but does not specify where this constant moves. It's not presentation logic — it's domain data that belongs in `src/lib/exercise-catalog.ts` (which already exists and serves as the offline fallback catalog). Leaving it in the component or the hook would violate separation of concerns. Separately, there's already `src/lib/exercise-catalog.ts` that serves this exact role — the constant may be duplicated.
- **Fix A ⭐ Recommended**: Add an explicit step to Phase 2 to move `FALLBACK_EXERCISE_CATALOG` into `src/lib/exercise-catalog.ts` and import it from there, consolidating with any existing fallback data.
  - Strength: Clean separation; single source of truth for fallback exercises.
  - Tradeoff: Minor additional file change.
  - Confidence: HIGH — the file already exists and serves the same purpose.
  - Blind spot: None.
- **Fix B**: Keep it inside `useExerciseSequence.ts` as an implementation detail of the hook.
  - Strength: No extra file changes.
  - Tradeoff: Duplicates domain data; hook becomes harder to test because fallback is baked in.
  - Confidence: MEDIUM — acceptable but architecturally messy.
- **Decision**: FIXED (Adopted Fix A: consolidate into src/lib/exercise-catalog.ts)

### F3 — `ExerciseResult` interface and `_exerciseResults` state unused/orphaned

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: `plan.md` — Phase 2; `ExerciseSequence.tsx` lines 16–19 and 68
- **Detail**: `ExerciseSequence.tsx` defines an `ExerciseResult` interface and `_exerciseResults` state (prefixed with `_` to suppress unused-variable lint), accumulated in `advanceNext()` but never read. The plan moves this state into `useExerciseSequence` without addressing whether it should be kept (M5 prep) or removed (dead code). If the hook exposes it, it becomes part of the public API without consumers; if it stays private, it's still dead code inside the hook.
- **Fix**: Add a note in Phase 2 to either (a) remove `_exerciseResults` and `ExerciseResult` as dead code, or (b) explicitly expose them from the hook's return value with a comment noting the M5 dependency. Either way, remove the `_` prefix lint suppression.
- **Decision**: FIXED (Dead code removed during Phase 2 refactor)

### F4 — Plan claims "5-poziomowa drabinka if/else" but actual nesting is 3 levels

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: `change.md` L23 — "Zagnieżdżona, 5-poziomowa drabinka"
- **Detail**: The brief claims a "5-level nested if/else ladder" in `rule-engine.ts`. The actual code (lines 33–50) has 3 nesting levels: `if (freshCandidates.length === 0)` → `if (candidates.length > 0)` / `else` → `if/else if/else`. The 5 items listed in the brief (`candidates` → `freshCandidates` → `generalCandidates` → `freshGeneral` → `catalog`) are _fallback stages_, not nesting levels. The plan correctly describes the 5 fallback steps (Phase 1 item 1), so the plan itself is accurate — only the brief's terminology is misleading. No plan change needed; noting for accuracy.
- **Fix**: Optionally update `change.md` L23 from "5-poziomowa drabinka if/else" to "5-etapowa kaskada fallbacków z 3-poziomowym zagnieżdżeniem" for precision.
- **Decision**: FIXED (Updated terminology in change.md)

### F5 — Missing `npm run lint` in Phase 1 and Phase 2 Success Criteria

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: `plan.md` — Phase 1 and Phase 2 Success Criteria; `change.md` L49
- **Detail**: The change brief (L49) lists "`npm run lint` bez błędów" as a top-level success criterion. Phase 1 Success Criteria only mentions unit tests and nesting depth. Phase 2 Success Criteria mentions `time-utils.test.ts`, line count, and `npm test` — but neither phase includes `npm run lint`. Since the refactoring introduces new files (`time-utils.ts`, `useExerciseSequence.ts`) and rewrites `rule-engine.ts`, lint verification after each phase is essential to catch import ordering, unused variables (like `_exerciseResults`), and type-checked lint rules.
- **Fix**: Add "`npm run lint` passes without errors" to both Phase 1 and Phase 2 Success Criteria, and include corresponding Progress checkboxes.
- **Decision**: FIXED (Added lint gates to Success Criteria and Progress)

## Summary

The plan is **well-scoped and architecturally sound** — it correctly identifies the two main debt areas, proposes appropriate refactoring strategies (pipeline pattern, Fisher-Yates, hook extraction, test-first time-utils), and the phases are sequenced to minimize risk (pure logic refactor first, then UI decomposition).

**Critical fixes needed** are structural/process issues (F1 Progress↔Criteria alignment, F5 missing lint gates) — not design flaws. **Warnings** (F2, F3) flag minor blind spots in the ExerciseSequence decomposition that should be explicitly addressed before implementation begins.

All 5 findings are low-to-medium effort fixes that can be applied directly to `plan.md` without changing the plan's architecture or scope.
