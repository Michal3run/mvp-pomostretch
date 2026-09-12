<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Rozbudowa bazy ćwiczeń (x2), kafelki 6 stref bólu i ilustracje SVG

- **Plan**: context/changes/exercise-catalog-expansion/plan.md
- **Scope**: All Phases
- **Date**: 2026-09-12
- **Verdict**: NEEDS ATTENTION
- **Findings**: 1 critical 3 warnings 1 observations

## Verdicts

| Dimension           | Verdict           |
| ------------------- | ----------------- |
| Plan Adherence      | WARNING           |
| Scope Discipline    | PASS              |
| Safety & Quality    | FAIL              |
| Architecture        | PASS              |
| Pattern Consistency | WARNING           |
| Success Criteria    | PASS              |

## Findings

### F1 — Destructive DB operations in migration

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql:3
- **Detail**: The UPDATE statements completely replace the `body_areas` array with a new hardcoded array (e.g., `ARRAY['wrists_hands', 'general']`). This will permanently destroy any other tags that might have been present on these records.
- **Fix**: Rewrite the UPDATE to use array_append or concatenation to safely add new tags while preserving existing ones.
- **Decision**: FIXED

### F2 — API route returns 302 redirect instead of 401 JSON

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Pattern Consistency
- **Location**: src/pages/api/break-input.ts:25
- **Detail**: The route performs an auth check but returns a 302 redirect. The project rules strictly state: "API routes (src/pages/api/**) must include their own context.locals.user auth check returning 401 JSON."
- **Fix A ⭐ Recommended**: Return a 401 JSON response as per the strict rule.
  - Strength: Complies exactly with the written rule for the API boundary.
  - Tradeoff: Might break UX for standard HTML form submissions if not intercepted by client JS.
  - Confidence: HIGH — the rule is explicit about API endpoints.
  - Blind spot: We haven't verified if client-side JS intercepts this form submission.
- **Fix B**: Keep the 302 redirect but move the handler out of `api/` (e.g., into the page itself).
  - Strength: Preserves UX while moving out of the strictly governed `api/` directory.
  - Tradeoff: Requires refactoring the form action and moving logic.
  - Confidence: MEDIUM — standard Astro pattern, but touches more files.
  - Blind spot: None significant.
- **Decision**: FIXED (Fix A)

### F3 — Redundant and conflicting cookie setting

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/api/break-input.ts:63
- **Detail**: Redundant cookie setting. The cookie is set via `context.cookies.set()` and then again via a raw `Set-Cookie` header in a manually constructed Response. The manual response also bypasses Astro's standard `context.redirect()`.
- **Fix**: Remove the manual `Response` return and rely solely on `context.redirect("/exercise-sequence")`.
- **Decision**: PENDING

### F4 — Missing unit test for lower_back

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/lib/rule-engine.test.ts
- **Detail**: Unit tests were added for `glutes_hips`, `wrists_hands`, and `random`, but there is no test for the `lower_back` tag as required by the plan's domain additions.
- **Fix**: Add a test case for `lower_back` in `src/lib/rule-engine.test.ts`.
- **Decision**: PENDING

### F5 — NLP matching logic extracted to separate files

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/api/break-input.ts
- **Detail**: The NLP matching logic is not located in this file as planned. It was extracted to `src/lib/break-input-keywords.ts` and `src/lib/break-input-parser.ts`.
- **Fix**: Accept the extraction as a positive architectural choice (no code change needed).
- **Decision**: PENDING
