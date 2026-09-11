<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Rozbudowa bazy ćwiczeń (x2), 6 kafelków i ilustracje SVG (`exercise-catalog-expansion`)

- **Plan**: context/changes/exercise-catalog-expansion/plan.md
- **Scope**: Phase 1 of 5
- **Date**: 2026-09-11
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 2 warnings, 3 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | WARNING |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | PASS    |

## Findings

### F1 — Accidental commit of unrelated changes from final-cleanup

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Scope Discipline
- **Location**: context/changes/final-cleanup/plan.md:73
- **Detail**: Commit 89ded69 ("feat(exercise-catalog-expansion): Rozszerzenie taksonomii i parsowania NLP (p1)") bundled edits to `context/changes/final-cleanup/plan.md` and `plan-brief.md`. Unrelated tasks should not be committed together with feature changes.
- **Fix A ⭐ Recommended**: Acknowledge and keep the documentation state on main, ensuring subsequent commits on `exercise-catalog-expansion` only touch relevant files.
  - Strength: Avoids rewriting git history on branch main which is up to date with origin.
  - Tradeoff: Leaves a noisy commit diff in repository history.
  - Confidence: HIGH — avoids git branch/upstream conflict.
  - Blind spot: None significant.
- **Fix B**: Revert final-cleanup modifications in a separate cleanup commit.
  - Strength: Clearly decouples final-cleanup state tracking from exercise-catalog-expansion.
  - Tradeoff: Requires an additional corrective commit.
  - Confidence: MEDIUM — depends on whether final-cleanup should remain deferred.
  - **Blind spot**: Status of final-cleanup milestone.
- **Decision**: FIXED (Fixed via Fix A — acknowledged, preserve git history and enforce commit scope discipline on future commits)

### F2 — Potential NLP parser bypass when quickPick is an empty string

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/break-input.ts:48
- **Detail**: `const textToAnalyze = quickPick ?? freeText ?? ""` uses nullish coalescing `??`. If an empty string `""` is sent for `quickPick` (e.g. from an API client or custom form submission), `"" ?? freeText` resolves to `""`. `textToAnalyze` remains empty even if `freeText` contains valid text, bypassing the NLP matcher and falling back to "general".
- **Fix**: Sanitize `quickPick` with `.trim()` so empty string resolves to `null` before evaluating `textToAnalyze`.
- **Decision**: FIXED (Fixed via Fix now)

### F3 — Phase 1 progress checkboxes left unchecked in plan.md

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/exercise-catalog-expansion/plan.md:79-83
- **Detail**: Phase 1 implementation was committed in 89ded69, but the Progress section in `context/changes/exercise-catalog-expansion/plan.md` still has `- [ ]` for both Phase 1 tasks.
- **Fix**: Update Phase 1 checkboxes in `plan.md` to `[x]`.
- **Decision**: FIXED (Fixed via Fix now)

### F4 — Missing colloquial Polish inflections and diacritic variants

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/api/break-input.ts:88-125
- **Detail**: The keyword matcher implements the base stems from `plan.md`, but omits several common inflections and non-diacritic variants listed in `change.md` (e.g., `dupie`, `dupę`, `tylka`, `kregoslup`, `losow`, `miks`). Phrases like "boli mnie w dupie" or "boli kregoslup" will not match and fall back to general.
- **Fix**: Add missing inflections (`dupie`, `dupę`, `tylka`, `kregoslup`, `losow`, `miks`) to `src/pages/api/break-input.ts`.
- **Decision**: FIXED (Fixed via Fix now)

### F5 — NLP keyword parser lacks isolated unit tests

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/api/break-input.ts:59
- **Detail**: The keyword matching algorithm was initially embedded directly inside the Astro APIRoute handler in `src/pages/api/break-input.ts` as a long chain of `if-includes` statements, without separate unit tests.
- **Fix**: Extracted declarative keyword dictionary into `src/lib/break-input-keywords.ts` and parsing logic into `src/lib/break-input-parser.ts`, backed by isolated unit tests in `src/lib/break-input-parser.test.ts`.
- **Decision**: FIXED (Fixed via Fix now)
