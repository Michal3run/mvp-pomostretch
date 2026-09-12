# Plan Review: ui-polish-redesign

> Reviewer: AI Agent | Date: 2026-09-12 | Status: **APPROVED WITH NOTES**

---

## Verdict

The plan is **solid and ready to implement**. It is well-scoped, the three-phase sequencing is logical (i18n → layout → Zen Mode), and the success criteria are concrete and verifiable. The issues below are minor — none block execution.

---

## Strengths

- **Fallback in `translateAuthError`** is correct: unknown Supabase errors silently break Polish-only UIs without it. The generic Polish fallback is the right call.
- **InfoButton integration into Topbar** correctly solves the `position: fixed` / `absolute` stacking collision that the current `top-4 right-4` in `dashboard.astro` would eventually cause when overlapping the nav.
- **`document.body` class toggle via `useEffect` cleanup** is the cleanest way to bridge the React island to a static Astro component — no shared state, no event bus.
- **Regex selector in E2E update** (`/Zakończ|Do przerwy/`) is pragmatic and correctly covers the rename without requiring two separate test runs.
- **Phase ordering** means no phase breaks the next: Phase 1 doesn't touch the timer or layout; Phase 2 doesn't touch CSS; Phase 3 finalises everything including E2E.

---

## Issues Found

### 🔴 Critical (must fix before merging)

_None._

### 🟡 Important (should fix before merging)

#### 1. `window.confirm` is blocked in Cloudflare Workers / Playwright headless

**Plan ref:** Phase 3, step 2 — `Porzuć sesję` uses `window.confirm(...)`.

`window.confirm` is synchronous and works in browsers, but:
- Playwright blocks native dialogs in headless mode by default. The E2E test for the abandon button will hang or silently pass the confirm without user interaction unless you add a `page.on('dialog', d => d.accept())` handler.
- If you intend to add an E2E test for this flow in Phase 3.2, it **must** include a dialog listener, or the test will time-out.

**Recommendation:** Either add a `page.on('dialog')` handler to the E2E that tests abandonment, or — preferably — use a controlled React state modal (`useState` + conditional render of a `<AlertDialog>` from shadcn/ui) instead of `window.confirm`. That also avoids inconsistent browser styling and is more accessible.

> If you keep `window.confirm`, note this in the plan explicitly so the E2E author knows to handle it.

#### 2. `skipAndStartNew()` title reset — already correct, no action needed

**Plan ref:** Phase 3, step 2; current `skipAndStartNew()` at line 127 of `PomodoroTimer.tsx`.

Current `skipAndStartNew()` already calls `window.document.title = "PomoStretch"`. The plan says the "Porzuć sesję" button calls `skipAndStartNew()` — that is correct ✅. Just confirming for completeness.

### 🟢 Minor (nice-to-have / informational)

#### 3. `client:load` directive missing from Topbar plan description

**Plan ref:** Phase 2, step 1 — `<InfoButton client:load />` inside `Topbar.astro`.

`Topbar.astro` is an Astro component. The file change description doesn't show the `client:load` directive explicitly (though it is implied). Add `client:load` explicitly to the code contract so there's no ambiguity.

#### 4. `zen-fade` scope — only Topbar targeted

The plan fades only the Topbar. If future phases add other peripheral elements (footer, sidebar), they won't benefit from Zen Mode unless they also get the `zen-fade` class. Not a current issue — noted for future reference.

#### 5. `src/lib/auth-errors.ts` missing: "Email rate limit exceeded"

Supabase occasionally emits `"Email rate limit exceeded"` under spam protection. The fallback covers it gracefully, but users get the generic message. Optionally add:

```ts
"Email rate limit exceeded": "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
```

#### 6. `@utility zen-fade` — Tailwind 4 syntax clarification

The plan description mixes Tailwind class-names (`opacity-15`) with CSS values inside `@utility`. In Tailwind 4, `@utility` blocks must contain **raw CSS**, not Tailwind utility names. The correct pattern:

```css
@utility zen-fade {
  opacity: 1;
  transition: opacity 300ms ease;
}

body.zen-active .zen-fade {
  opacity: 0.15;
}

body.zen-active .zen-fade:hover {
  opacity: 1;
}
```

Verify this locally with a quick `npm run build` before committing Phase 3.

---

## Risks Assessment

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| `window.confirm` blocked in headless E2E | Medium | Medium | Add `page.on('dialog')` or swap to shadcn `AlertDialog` |
| Unknown Supabase error reaches UI in English (fallback fires) | Low | Low | Generic Polish fallback already handles it |
| `@utility` CSS syntax ambiguity (Tailwind 4) | Low | Low | Write raw CSS inside the at-rule, test locally |
| E2E regression: button rename "Zakończ" → "Do przerwy" | Low (mitigated by plan) | High | Phase 3.3 regex update handles both names |

---

## Pre-Implementation Checklist

- [ ] Decide `window.confirm` strategy (native + `page.on('dialog')` vs. shadcn `AlertDialog`) before starting Phase 3
- [ ] Verify `@utility` block syntax with a local build before committing Phase 3
- [ ] Ensure `client:load` directive is included for `InfoButton` in `Topbar.astro`
- [ ] Optionally add "Email rate limit exceeded" to the error mapping in Phase 1

---

## Files to Touch (summary)

| File | Phase |
|---|---|
| `src/lib/auth-errors.ts` (new) | 1 |
| `src/lib/auth-errors.test.ts` (new) | 1 |
| `src/components/auth/SignInForm.tsx` | 1 |
| `src/components/auth/SignUpForm.tsx` | 1 |
| `src/pages/auth/signin.astro` | 1 |
| `src/pages/auth/signup.astro` | 1 |
| `src/components/Topbar.astro` | 2 |
| `src/pages/dashboard.astro` | 2 |
| `src/styles/global.css` | 3 |
| `src/components/PomodoroTimer.tsx` | 3 |
| `tests/e2e/us-01.spec.ts` | 3 |
| `tests/e2e/break-input.spec.ts` | 3 |
