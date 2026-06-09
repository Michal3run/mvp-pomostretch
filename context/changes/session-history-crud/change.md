---
change_id: session-history-crud
status: proposed
created: 2026-06-08
owner: solo
type: pivot
blocks_certification: true
related_prd_sections:
  - "## Functional Requirements / Break-Input Flow"
  - "## Functional Requirements / Exercise Sequence"
  - "## Business Logic"
  - "## Access Control"
related_frs: [FR-019]
new_frs: [FR-023, FR-024, FR-025, FR-026, FR-027]
new_nfrs: [NFR-10]
test_plan_risks: [R-02, R-05, R-13]
---

# Change: session-history-crud — promote break history to a user-owned CRUD entity

> **One-line summary.** Move the break-session record from `localStorage` (per the original Phase 3 A2 scope-down) to a Supabase Postgres table `break_session`, expose it as a user-owned CRUD over four authenticated endpoints, and add a "Historia przerw" page so the MVP has a real domain CRUD that the certification rubric requires.

## Why now

The MVP framing (PRD, shape-notes Phase 7) accepted *"DB CRUD via auth + exercise catalog"* as satisfying the course's data-management requirement. Re-reading the official requirements pasted in chat on 2026-06-08:

> *"Data management — creating, reading, updating, and deleting items (CRUD) in a way that makes sense for the application domain"* — and — *"Empty CRUD — a task list or book list is a good foundation, but the list alone isn't enough. Add a rule: recommendation, prioritization, validation, scoring."*

makes the gap explicit:

- **Auth sign-up is not domain CRUD** — it's an access-control side effect, the user does not "manage" their email row.
- **The exercise catalog is read-only for users** — admin maintains it via direct DB UPDATE per OQ1; it satisfies "R" only.
- **Pomodoro state and break history live in `localStorage`** — by design (Phase 3 A2), but `localStorage` is per-device cache, not a persisted domain entity the user can list, edit, or delete from a server.

The product **already has the harder half** — the rule engine doing the body-area tag match + no-repeat. What's missing is a user-owned entity exercising all 4 CRUD verbs against that logic. Adding `break_session` closes the gap **without** changing the product story: it's the same break record we were going to keep anyway, just promoted from device-local cache to a server-side row the user owns.

## What changes

### Data model

New table `public.break_session` (Supabase Postgres):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK, default `gen_random_uuid()`) | |
| `user_id` | `uuid` (FK → `auth.users.id`, on delete cascade) | RLS pivot |
| `created_at` | `timestamptz` (default `now()`) | when the break started |
| `ended_at` | `timestamptz` (nullable) | NULL = abandoned (closed tab mid-break); set when "Resume work?" is shown or when the user skips the whole break |
| `input_kind` | `text check (input_kind in ('quick_pick','free_text'))` | how the user described their pain |
| `input_value` | `text` | the raw input — quick-pick label or the free-text string |
| `derived_tags` | `text[]` | output of the keyword matcher — body-area tags actually used by the rule engine |
| `selected_exercise_ids` | `uuid[]` | references `exercise.id`; ordered, length 1..3 |
| `completed_count` | `int` (default 0) | how many exercises the user marked Done |
| `skipped_count` | `int` (default 0) | how many the user marked Skip |
| `note` | `text` (nullable, ≤ 500 chars) | **the user-editable field**: where the U in CRUD lives |

**RLS policies** (mandatory — see R-02 / R-05 in test-plan):

- `select`: `user_id = auth.uid()`
- `insert`: `user_id = auth.uid()` (with-check)
- `update`: `user_id = auth.uid()` (using + with-check) — only `note` is updatable from the API; other columns are immutable post-insert (enforced at the route handler, not in SQL, so we can keep the column list flexible).
- `delete`: `user_id = auth.uid()`

**Index**: `(user_id, created_at desc)` to make the "Historia przerw" list query cheap.

**Migration file**: `supabase/migrations/<timestamp>_create_break_session.sql`.

### API endpoints

All under `src/pages/api/sessions/` (Astro endpoints, server-rendered, gated by the same middleware as `/dashboard`):

| Verb + path | Body | Returns | Notes |
|---|---|---|---|
| `POST /api/sessions` | `{ input_kind, input_value, derived_tags, selected_exercise_ids }` | `{ id, ...row }` | Create. Called by the client *after* the exercise sequence renders, so it does **not** sit on the < 1.5s critical path (NFR-1). |
| `GET /api/sessions` | — | `{ items: [...], next_cursor? }` | Read list. Cursor pagination over `created_at desc`. |
| `GET /api/sessions/:id` | — | `{ ...row }` | Read one. Returns 404 if not owned (don't leak existence). |
| `PATCH /api/sessions/:id` | `{ note? \| ended_at? \| completed_count? \| skipped_count? }` | `{ ...row }` | Update. `note` is the user-driven case; `ended_at` / counts are client-driven progress writes from the exercise-sequence screen. Whitelist of editable fields enforced server-side. |
| `DELETE /api/sessions/:id` | — | `204` | Delete. Hard delete (no soft-delete in MVP). |

Validation: zod schema in `src/lib/sessions/schema.ts`, applied at every route. Free-text `input_value` length cap 500 chars (matches `note` cap; cheap DoS guard).

### UI

1. **New page** `src/pages/history.astro` — "Historia przerw":
   - Reverse-chronological list of `break_session` rows for the signed-in user.
   - Each row shows: date+time, input (quick-pick label or truncated free-text), derived tags, exercises (names resolved from catalog), Done/Skip counts, `note` field (inline-editable textarea), Delete button (with confirm).
   - Empty state: "Nie masz jeszcze żadnych przerw. Wróć tu po pierwszym pomodoro."
2. **Topbar link** — add "Historia" between current Topbar items and Sign-out.
3. **End-of-break flow change** — after "Resume work?" prompt, a `POST /api/sessions` fires with the just-completed break payload. Failure does not block the user (toast + retry once, then drop — does not interrupt the work-session resumption).
4. **No-repeat rule data source** — the `getLastSessionTags()` call switches from `localStorage.getItem('pomostretch.lastSession')` to `GET /api/sessions?limit=1`. The result feeds the rule engine the same way it did before. Latency: this is on the critical path, but the query is `select 1 row by (user_id, created_at desc)` against an indexed table — measured-once budget ≪ 100 ms, comfortably inside NFR-1.

### Rule engine + business logic

The rule engine signature **does not change** — it still consumes `(input_tags, last_session_tags, catalog) → ordered list of 1..3 exercises`. Only the wiring upstream changes (DB read instead of `localStorage` read). FR-019 (no-repeat) and FR-021 (tag match) and FR-022 (non-empty result) all keep their semantics.

This is the core argument for the change: **business logic stays untouched, only persistence moves**. The course rubric reads "CRUD + non-empty business logic"; this change preserves the second half (rule engine) while adding the first half (user-owned 4-verb CRUD against `break_session`).

### Functional Requirements — additions to PRD

To be appended to `context/foundation/prd.md` `## Functional Requirements` under a new sub-section **"Break Session History (CRUD)"**:

- **FR-023**: User can list their own past break sessions, ordered newest-first, on a "Historia przerw" page.
- **FR-024**: User can open a past break session and see its input, derived tags, selected exercises, and completion counts.
- **FR-025**: User can add or edit a free-text `note` (≤ 500 chars) on any of their own past break sessions.
- **FR-026**: User can delete any of their own past break sessions; the row is removed permanently and disappears from the list.
- **FR-027**: A user cannot read, update, or delete a break session belonging to another user — server-enforced via Postgres RLS, not just UI hiding.

### Non-Functional Requirements — addition

- **NFR-10 — Break-session ownership integrity.** Every read, write, and delete against `break_session` is gated by Supabase RLS bound to `auth.uid()`; bypassing the UI (direct API call with another user's id in the URL or body) returns 404 / 403 without leaking the row's existence. (MVP must.)

### Tests this change introduces (planned, not implemented)

Cross-referenced with `context/foundation/test-plan.md`:

- **R-02 / R-05** — Integration: two-user RLS tests covering all four verbs (A creates, B's `GET /:id` returns 404; B's `PATCH /:id` returns 404; B's `DELETE /:id` returns 404; A's `GET /` does not include B's rows).
- **R-13** — Integration: DELETE then GET round-trip returns 404.
- **R-03** (existing) — extended: the E2E happy path now ends with `expect(history page to show the just-completed break)`.

The first test to land for certification is the existing R-03 (E2E happy path) — same recommendation as in `test-plan.md`. R-02 / R-05 are second-priority but **must** ship before public deploy, because they are course-rubric load-bearing (CRUD without correct ownership is a worse demo than no CRUD).

## What does NOT change

- Auth flow, sign-in / sign-up forms, middleware gating logic.
- Pomodoro work-timer state — stays in `localStorage` per Guardrail G3 (timer survives refresh; that requirement is not about "user can list past timers", it's about "this 25-min timer doesn't reset on Ctrl+R"). DB persistence of timer state is a different change and is **not** required by this one.
- Exercise catalog table, seed, or admin workflow (still direct DB UPDATE per OQ1).
- Rule engine internals.
- The 4 quick-pick options, the free-text input, the keyword matcher.

## Risks introduced (and mitigations)

| Risk | Mitigation |
|---|---|
| RLS mis-configured → cross-user data leak | Two-user integration test (R-02 / R-05) before any deploy; `supabase db lint` + `supabase test db` if available. |
| `POST /api/sessions` failure leaves UI inconsistent (user thinks break was saved, DB says no) | Optimistic UI: show success in toast immediately, retry once on failure, on second failure show toast "Nie zapisaliśmy tej przerwy w historii — pozostała część działa normalnie". The session continues regardless. |
| No-repeat rule now depends on a network call (DB read) instead of synchronous `localStorage` | Keep a `localStorage` mirror of the last session (write-through cache); rule reads cache first, falls back to DB on cache miss. NFR-1 latency unchanged in the common case. |
| Schema migration during course timeline → forgetting to apply migration to staging | Single migration file checked into `supabase/migrations/`; CI step `supabase db push --dry-run` (added in a follow-up CI change) catches drift. Manual `supabase db push` against staging is the deploy gate until then. |
| Scope creep into a "stats dashboard" | Out of scope per PRD Non-Goals #4 (streaks/gamification). The Historia page is a **list + edit-note + delete**, nothing more — explicitly no charts, no aggregations, no streaks. If this slips, drop the change back to read-only list and accept the "U" via `note`-only edit. |

## Effort estimate

Solo, after-hours, with current Astro + Supabase wiring already bootstrapped:

| Slice | Estimate |
|---|---|
| Migration + RLS policies + local `supabase start` test | 1.5 h |
| 5 API endpoints + zod schema + ownership checks | 2.5 h |
| Switch no-repeat data source (DB read + localStorage cache) | 1 h |
| Historia page (list + inline note edit + delete confirm) | 2 h |
| Topbar link + end-of-break POST wiring + toast on failure | 1 h |
| Manual smoke test against local Supabase, fix obvious bugs | 1 h |
| **Total** | **~9 h** |

This fits inside the remaining MVP budget (PRD frontmatter `mvp_weeks: 3`, `after_hours_only: true`) without compressing other work.

## Definition of done

1. `supabase/migrations/<timestamp>_create_break_session.sql` exists, applies cleanly to a fresh `supabase start`, and creates the table + indexes + RLS policies as specified above.
2. All five endpoints respond correctly to the happy path and return 401 (unauth) / 404 (not owned) / 400 (bad input) on the failure paths, verified manually.
3. The dashboard end-of-break flow successfully POSTs a session and the row appears on the Historia page.
4. The no-repeat rule pulls the previous session's tags from the DB (verified by clearing `localStorage` and observing that the next break still excludes the previous exercise).
5. The Topbar shows "Historia" between current items and Sign-out for signed-in users only.
6. PRD updated with FR-023..FR-027 and NFR-10; shape-notes Open Question 1 status updated to reflect the new entity.
7. The change folder contains a final `## Verification` section (appended to this file at completion) listing what was manually tested and on which date.

## Open questions

1. **Pagination cursor format** — opaque base64 of `(created_at, id)` is overkill for an MVP; first version returns all rows up to a hardcoded limit (e.g. 50) and adds cursor pagination only if a real user reports they need it. Owner: solo.
2. **Should `note` accept Markdown?** No in MVP; plain text only, displayed as-is. Re-evaluate post-cert. Owner: solo.
3. **GDPR "delete-all-my-data" affordance** — `DELETE /api/sessions` (no id, clears all rows for the user) is listed in the API table above but not strictly required for cert. Ship it if there's time; defer otherwise. Owner: solo.
