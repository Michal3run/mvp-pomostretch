<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Rozbudowa bazy ćwiczeń (x2), 6 kafelków i ilustracje SVG (`exercise-catalog-expansion`) — Faza 2

- **Plan**: context/changes/exercise-catalog-expansion/plan.md
- **Scope**: Phase 2 of 5
- **Date**: 2026-09-11
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 2 warnings, 2 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | WARNING |

## Findings

### F1 — E2E test `us-01.spec.ts` fails on `getByRole("button", { name: "Tylko kark" })`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/us-01.spec.ts:50
- **Detail**: In commit 691db2f, the visible label of the neck quick-pick card was updated from "Tylko kark" to "Kark i szyja". The plan noted `(zachowujemy value="Tylko kark" dla zgodności z tests/e2e/us-01.spec.ts)`, assuming that the button's `value` attribute would preserve matching for Playwright's `getByRole("button", { name: "Tylko kark" })`. However, per W3C AccName 1.2 specification, the accessible name of a `<button>` is derived from its subtree text ("💆 Kark i szyja"), not its `value` attribute. Playwright's locator matches 0 elements, breaking the US-01 E2E test.
- **Fix A ⭐ Recommended**: Update `tests/e2e/us-01.spec.ts:50` to `page.getByRole("button", { name: /Kark i szyja|Tylko kark/ })` or `"Kark i szyja"`, as anticipated in `change.md:97`.
  - Strength: Aligns the test locator with actual user-facing UI and adheres to `/10x-e2e` accessible locator rules.
  - Tradeoff: Modifies test file.
  - Confidence: HIGH — verified via Playwright accessible name computation.
  - Blind spot: None.
- **Fix B**: Add `aria-label="Tylko kark - Kark i szyja"` to the button in `src/pages/break-input.astro`.
  - Strength: Fixes the test without modifying `tests/e2e/us-01.spec.ts`.
  - Tradeoff: Injects legacy text into the accessibility tree for screen reader users.
  - Confidence: HIGH — Playwright substring match will locate the button.
  - Blind spot: Screen readers will announce legacy label.
- **Decision**: FIXED (Fixed via Fix A)

### F2 — Decorative emoji in quick-pick buttons lack `aria-hidden="true"`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/break-input.astro:33,43,53,63,73,83
- **Detail**: Each of the 6 quick-pick buttons contains an emoji wrapped in `<span class="text-2xl">` without `aria-hidden="true"`. Screen readers announce the unicode emoji names (e.g., "person getting massage", "game die") preceding the Polish text label. Per WCAG 2.1 SC 1.1.1 (Non-text Content), decorative graphical elements accompanying visible labels should be hidden from assistive technology.
- **Fix**: Add `aria-hidden="true"` to each emoji `<span>` element across all 6 buttons in `src/pages/break-input.astro`.
- **Decision**: FIXED (Fixed via Fix now)

### F3 — Inconsistent `quickPick` value naming convention

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/pages/break-input.astro:29,39
- **Detail**: Buttons 1 and 2 pass legacy values `value="Tylko oczy"` and `value="Tylko kark"` while their visible labels are `"Oczy i wzrok"` and `"Kark i szyja"`. Meanwhile, buttons 3–6 pass values that match their labels (`"Lędźwie i plecy"`, `"Pośladki i biodra"`, `"Dłonie i nadgarstki"`, `"Zaskocz mnie"`). With the Phase 1 NLP parser mapping keywords dynamically, both "Oczy i wzrok" and "Kark i szyja" are recognized as `eyes` and `neck`. Keeping legacy "Tylko X" values causes inconsistent `input_value` records in `break_session`.
- **Fix**: Align `value` attributes on buttons 1 and 2 to `"Oczy i wzrok"` and `"Kark i szyja"`.
- **Decision**: FIXED (Fixed via Fix now)

### F4 — Text alignment and padding on narrow mobile viewports

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pages/break-input.astro:31,41,51,61,71,81
- **Detail**: In narrow mobile viewports (<375px), 2-column buttons may wrap text like "Dłonie i nadgarstki" or "Pośladki i biodra" onto two lines. The buttons specify `items-center justify-center`, but omit `text-center px-2`, which may result in left-aligned wrapped text and text touching the edges.
- **Fix**: Add `text-center px-2` to the Button classes on all 6 quick-pick cards.
- **Decision**: FIXED (Fixed via Fix now)
