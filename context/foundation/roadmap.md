---
project: PomoStretch
version: 1
status: draft
created: 2026-07-10
context_type: greenfield
owner: solo
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-07-31
baseline_state: bootstrap-complete
related_docs:
  - context/foundation/prd.md
  - context/foundation/tech-stack.md
  - context/foundation/infrastructure.md
  - context/foundation/test-plan.md
  - context/changes/session-history-crud/change.md
---

# PomoStretch — MVP Roadmap

## Purpose

This roadmap sequences the MVP implementation from the current bootstrap-complete baseline to a certifiable product that delivers US-01 (full pomodoro work-then-break-with-exercise cycle) end-to-end. It bridges the PRD's functional requirements with the technical reality that auth is 90% done but no product features exist yet — no timer, no break flow, no exercise catalog, no database schema.

The roadmap prioritizes **vertical slices** — user-visible outcomes that cross UI, business logic, data, and integrations — over horizontal layers. The only exception is M1 (Database Schema & Exercise Catalog), a bounded horizontal enabler that unblocks two downstream verticals (M4 exercise selection, M5 break history CRUD) and is kept deliberately narrow (two tables, seed data, no endpoints yet).

## Baseline State

**What exists** (end of M3):

- Auth foundation (sign-up/sign-in/sign-out, Supabase)
- Database schema: `exercise` and `break_session` tables created, 12 seed exercises (M1)
- Pomodoro timer: functional timer at dashboard with local storage persistence (M2)
- Break input page: quick-pick buttons + keyword matching, saves to cookie (M3)
- CI pipeline + Cloudflare workers deployment

**What's missing** (gaps preventing US-01 demo):

- Exercise sequence page with Done/Skip and Rule Engine (M4 - FR-014 through FR-019)
- Break history CRUD: 5 API endpoints + history page (M5 - FR-023 through FR-027)
- Any tests (M6 - test-plan.md exists, no test code written yet)

**Status of existing change folders**:

- `context/changes/session-history-crud/` contains `change.md` (proposed specification from 2026-06-08, status: proposed, not implemented). This change is planned as M5 in this roadmap.
- `context/changes/bootstrap-verification/` contains verification from initial scaffold (✅ completed)
- `context/changes/deployment/` contains deployment plan (✅ **executed 2026-06-09** — production live at https://pomo-stretch.michal3run.workers.dev, Supabase project created, secrets configured, auto-deploy via Cloudflare Workers Builds active)

**Current capabilities**:

- ✅ User can register, sign in, sign out (FR-001 through FR-003)
- ✅ Unauthenticated user redirected to sign-in (FR-004)
- ✅ Production deployment live at https://pomo-stretch.michal3run.workers.dev
- ✅ Database deployed with exercise seed data (M1)
- ✅ Pomodoro Timer works and persists state (FR-005 through FR-009, M2)
- ✅ Break Input matches keywords and saves tags to cookie (FR-010 through FR-013, M3)
- ❌ No exercise recommendation sequence yet (M4)
- ❌ No break history yet (M5)

## Success Criteria for Roadmap Completion

**Primary** — User Story US-01 demoable end-to-end:

- Signed-in user starts a 25-min work session from the dashboard
- Timer counts down (or user manually ends early)
- User taps "Tylko kark" on break-input screen
- User sees 1-3 neck-tagged exercises with countdowns
- User marks each Done or Skip
- User sees "Resume work?" prompt and can start a new work session

**Secondary** — Certification requirements met:

- At least one E2E test covering US-01 (R-03 from test-plan.md)
- Integration tests for access control (R-01) and CRUD authorization (R-02, R-05)
- Unit test for rule engine robustness (R-04) — all 4 quick-picks yield ≥1 exercise
- Production deployment complete with secrets configured

**Guardrails validated**:

- G1: Break content loads in < 1.5s p95 (NFR-1)
- G2: User can Skip at any point without dead-ends
- G3: Timer state survives page refresh (NFR-2)

### Definition of Done (Top-Level Checklist)

The roadmap is complete when **all** of the following are green:

- [ ] **M0-M5 shipped**: M0, M1, M2, M3 done. M4, M5 pending.
- [ ] **US-01 demoable**: Full pomodoro cycle (sign-in → timer → break → exercises → resume) works end-to-end on production
- [ ] **CRUD certified**: Break history page accessible, user can view/edit/delete their own sessions, RLS tested with two users
- [ ] **Tests green in CI**: E2E (R-03), integration (R-01, R-02, R-04, R-05, R-13), all passing
- [ ] **Guardrails validated**: G1/G2/G3 measured and confirmed (see M6 measurement protocols)
- [ ] **Production deployed**: ~~Cloudflare Worker live~~ ✅, ~~Supabase project created~~ ✅, ~~secrets configured~~ ✅, ~~M1 migrations applied~~ ✅, smoke test passed
- [ ] **Documentation current**: README updated with production URL (https://pomo-stretch.michal3run.workers.dev), setup instructions, test commands
- [ ] **No P0/P1 bugs**: All High-impact risks from Risk Register resolved or accepted with documented mitigation

This checklist is the single source of truth for "are we done?"

**Note**: Infrastructure deployment was completed 2026-06-09. Remaining work is product features (M1-M5) + tests (M6).

## Milestone Overview

Six milestones, ordered by dependency and risk:

| ID     | Name                               | Type              | Unlocks          | Estimated Effort |
| ------ | ---------------------------------- | ----------------- | ---------------- | ---------------- |
| **M0** | Auth Foundation                    | Vertical (done)   | M2, M5           | ✅ Complete      |
| **M1** | Database Schema & Exercise Catalog | Horizontal (done) | M4, M5           | ✅ Complete      |
| **M2** | Pomodoro Timer                     | Vertical (done)   | M3               | ✅ Complete      |
| **M3** | Break Input & Keyword Matching     | Vertical (done)   | M4               | ✅ Complete      |
| **M4** | Exercise Selection & Sequence      | Vertical          | US-01 complete   | 5-6h             |
| **M5** | Break History CRUD                 | Vertical          | Certification    | 6-8h             |
| **M6** | Testing & Certification            | Cross-cutting     | Production-ready | 6-8h             |
| **M7** | UAT & Feedback Polish (Post-MVP)   | Vertical (done)   | Production-ready | ✅ Complete      |

**Total estimated effort**: 27-35 hours (milestone-level coding) + **5-7 hours integration buffer** (handoff friction, cross-milestone debugging, refactoring) = **32-42 hours realistic total** (within 3-week after-hours budget of ~36-45h at 12-15h/week).

**Integration buffer rationale**: Each milestone estimates its own implementation time, but experience shows 15-20% of total effort goes to:

- Resolving interface mismatches between milestones (e.g., M3 cookie format doesn't match M4 expectations)
- Refactoring shared logic (e.g., timer state management used by M2 and M4)
- Debugging cross-milestone flows (e.g., M2 → M3 → M4 navigation chain fails in ways invisible to unit tests)

The 27-35h estimate is achievable if milestones are built in perfect isolation and integrate cleanly on first try. The 5-7h buffer accounts for reality.

## Dependency Graph

```
M0 (Auth) ──┬──→ M2 (Timer) ──→ M3 (Break Input) ──→ M4 (Exercise Selection) ──→ US-01 ✅
            │                                              ↑
            │                                              │
            └──→ M1 (DB Schema) ─────────────────────────┘
                        │
                        └──────────────────→ M5 (History CRUD) ──→ Certification ✅

M6 (Testing) wraps M4 + M5 + deployment
```

**Key dependencies**:

- M1 blocks M4 (rule engine needs `exercise` table) and M5 (history needs `break_session` table)
- M2 blocks M3 (break-input screen is reached via "Zaczynaj przerwę" button or timer expiry)
- M3 blocks M4 (exercise selection consumes break-input submission)
- M4 completion enables US-01 demo (primary success criterion)
- M5 completion satisfies certification requirement (domain CRUD with business logic)

**Parallelization opportunities**:

- M1 and M2 can start in parallel (no shared dependencies beyond M0)
- M5 can start as soon as M1 completes (does not depend on M2/M3/M4)

**Why M1 is horizontal** (and why it's allowed):

- M1 delivers no user-visible feature — it's a database schema migration + seed data
- But it's **bounded**: exactly two tables (`exercise`, `break_session`), no API endpoints, no UI
- It **names its downstream verticals**: M4 (exercise selection) and M5 (break history)
- It's the **smallest horizontal** that unblocks both — splitting it per-vertical would duplicate work

## M1: Database Schema & Exercise Catalog

**Type**: Bounded horizontal enabler  
**Estimated effort**: 3-4 hours  
**Blocks**: M4 (Exercise Selection), M5 (Break History CRUD)  
**Depends on**: M0 (Auth — needs `auth.users.id` FK)

### Outcome

Two Supabase migrations written and applied to local dev + staging:

1. `exercise` table with 12-15 seed rows covering 4 body-areas (eyes, neck, shoulders, lower-back), each tagged with ≥2 exercises
2. `break_session` table with RLS policies enforcing user ownership

No API endpoints, no UI — this milestone is schema + seed only.

### Acceptance Criteria

- [x] `supabase/migrations/<timestamp>_create_exercise_table.sql` exists and applies cleanly
- [x] `supabase/migrations/<timestamp>_create_break_session_table.sql` exists and applies cleanly
- [x] `SELECT COUNT(*) FROM exercise` returns ≥12 rows
- [x] Every quick-pick mapping (`Tylko oczy` → `eyes`, `Tylko kark` → `neck`, `Ogólne` → `general`, `Zaskocz mnie` → `random`) matches ≥2 exercises in the seed data (validates FR-022 robustness)
- [x] `break_session` has RLS enabled with 4 policies: `SELECT`, `INSERT`, `UPDATE`, `DELETE` all gated by `user_id = auth.uid()`
- [x] Local `supabase start` can query both tables
- [x] Staging Supabase project has both migrations applied

### Schema: `exercise`

| Column             | Type          | Constraints                           |
| ------------------ | ------------- | ------------------------------------- |
| `id`               | `uuid`        | PK, default `gen_random_uuid()`       |
| `name`             | `text`        | NOT NULL                              |
| `description`      | `text`        | NOT NULL, 50-200 chars guideline      |
| `duration_seconds` | `int`         | NOT NULL, CHECK (30 ≤ duration ≤ 120) |
| `body_areas`       | `text[]`      | NOT NULL, CHECK (array_length > 0)    |
| `created_at`       | `timestamptz` | default `now()`                       |

**Valid `body_areas` values** (enforced at seed time, not DB constraint): `eyes`, `neck`, `shoulders`, `lower_back`, `general`.

**RLS**: None (exercise catalog is public-read for all authenticated users). Add policy: `SELECT` to `authenticated` role.

**Index**: None required for MVP (12-15 rows).

### Schema: `break_session`

| Column                  | Type          | Constraints                                         |
| ----------------------- | ------------- | --------------------------------------------------- |
| `id`                    | `uuid`        | PK, default `gen_random_uuid()`                     |
| `user_id`               | `uuid`        | FK → `auth.users.id` ON DELETE CASCADE, NOT NULL    |
| `created_at`            | `timestamptz` | default `now()`                                     |
| `ended_at`              | `timestamptz` | nullable                                            |
| `input_kind`            | `text`        | CHECK (`input_kind` IN ('quick_pick', 'free_text')) |
| `input_value`           | `text`        | NOT NULL                                            |
| `derived_tags`          | `text[]`      | NOT NULL                                            |
| `selected_exercise_ids` | `uuid[]`      | NOT NULL, CHECK (array_length ∈ {1,2,3})            |
| `completed_count`       | `int`         | default 0                                           |
| `skipped_count`         | `int`         | default 0                                           |
| `note`                  | `text`        | nullable, ≤500 chars                                |

**RLS policies** (all gated by `user_id = auth.uid()`):

- `SELECT`: authenticated users see only their own rows
- `INSERT`: authenticated users can insert with their own `user_id`
- `UPDATE`: authenticated users can update only their own rows (with-check: updated `user_id` still matches)
- `DELETE`: authenticated users can delete only their own rows

**Index**: `(user_id, created_at DESC)` for history page list query.

### Seed Data Strategy

Write 12-15 exercises as `INSERT` statements in the migration file, not as separate seed script. This keeps schema + seed atomic and version-controlled.

**Coverage target** (validates FR-022):

- `eyes`: ≥2 exercises (e.g., "20-20-20 rule", "Palming")
- `neck`: ≥2 exercises (e.g., "Neck rolls", "Chin tucks")
- `shoulders`: ≥2 exercises (e.g., "Shoulder shrugs", "Arm circles")
- `lower_back`: ≥2 exercises (e.g., "Seated spinal twist", "Cat-cow stretch")
- `general`: ≥2 exercises that work for any input (e.g., "Stand and stretch", "Deep breathing")

Some exercises can be multi-tagged (e.g., "Shoulder and neck rolls" has `body_areas = ARRAY['neck', 'shoulders']`), which helps cover combinations efficiently.

### Risks

| Risk                                                                           | Mitigation                                                                                                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exercise descriptions are low-quality / copy-pasted from web → copyright issue | Write original descriptions (50-200 chars each) based on general ergonomic knowledge, not verbatim from any single source. This is creative work — allow 1.5-2h of the 3-4h budget. |
| Seed data doesn't cover all 4 quick-picks → FR-022 violated                    | Write coverage validation query in the migration comment; run manually before marking M1 done.                                                                                      |
| RLS policies misconfigured → M5 authorization bugs (R-02, R-05)                | Test with two local users: create session as user A, attempt to `SELECT` as user B via `psql`, expect 0 rows. Document this check in M1 acceptance criteria.                        |
| Migration file naming collision                                                | Use `YYYYMMDDHHmmss_` prefix from `date +%Y%m%d%H%M%S`; check `supabase/migrations/` before generating.                                                                             |

### Handoff to Next Milestone

**M4 (Exercise Selection)** depends on `exercise` table being queryable. Before starting M4, validate:

```sql
SELECT body_areas, COUNT(*) FROM exercise GROUP BY body_areas;
```

Each quick-pick mapping has ≥2 matches.

**M5 (Break History CRUD)** depends on `break_session` table existing with correct RLS. Before starting M5, validate:

```sql
-- As user A
INSERT INTO break_session (...) VALUES (...);
-- As user B
SELECT * FROM break_session WHERE user_id = <user_A_id>; -- expect 0 rows
```

## M2: Pomodoro Timer

**Type**: Vertical slice  
**Estimated effort**: 4-5 hours  
**Blocks**: M3 (Break Input)  
**Depends on**: M0 (Auth — dashboard is gated)  
**PRD coverage**: FR-005 through FR-009, NFR-2 (timer durability)

### Outcome

Dashboard (`src/pages/dashboard.astro`) transforms from a placeholder into a functional pomodoro timer. Signed-in user can:

- Start a 25-minute work session
- See live countdown (MM:SS format, updates every second)
- Extend session by +5 minutes (unlimited times)
- Manually end session early via "Zaczynaj przerwę" button
- Experience auto-transition to break-input screen when countdown reaches 00:00

Timer state persists in `localStorage` — a page refresh during an active session restores the timer at the correct elapsed time (NFR-2 / Guardrail G3).

### Acceptance Criteria

- [x] Dashboard shows "Start work session" button when no active session
- [x] Clicking "Start" creates a 25-min timer, button changes to countdown display
- [x] Countdown updates every second in MM:SS format
- [x] "+5 min" button visible during active session, extends remaining time by 300 seconds
- [x] "Zaczynaj przerwę" button visible during active session, navigates to `/break-input`
- [x] When countdown reaches 00:00, auto-navigate to `/break-input`
- [x] `localStorage.getItem('pomostretch.timer')` contains `{ startedAt, durationMs, extendedMs }` during active session
- [x] Page refresh during active session (e.g., at 12:34 remaining) restores timer at correct remaining time (±2s tolerance)
- [x] Closing tab and reopening within ~30s restores timer (validates NFR-2)
- [x] Timer state clears from `localStorage` when session ends (manual or auto)

### Implementation Notes

**State management** (React island at `src/components/PomodoroTimer.tsx`):

```typescript
interface TimerState {
  startedAt: number; // Date.now() when session began
  durationMs: number; // 25 * 60 * 1000 (base duration)
  extendedMs: number; // accumulated +5min extensions
}
```

Store in `localStorage` under key `pomostretch.timer`. On mount, check for existing state:

- If present and `(Date.now() - startedAt) < (durationMs + extendedMs)` → resume countdown
- If present and elapsed ≥ total **by ≤ 60 seconds** → expired recently, auto-navigate to `/break-input`
- If present and elapsed ≥ total **by > 60 seconds** → expired long ago (user closed laptop for hours), show "expired session" state with manual confirmation before navigating
- If absent → show "Start" button

**Expired session state** (when timer expired > 1 min ago):

```
┌─────────────────────────────────────┐
│  ⏱️ Sesja zakończona                │
│                                     │
│  Twoja ostatnia sesja robocza       │
│  zakończyła się podczas gdy         │
│  byłeś/aś nieobecny/a.              │
│                                     │
│  [Rozpocznij przerwę teraz]         │
│  [Pomiń i zacznij nową sesję]       │
└─────────────────────────────────────┘
```

This prevents the jarring experience of opening laptop after 2 hours and immediately being yanked to break-input with no explanation. User gets context + choice.

**Countdown update**: `setInterval` every 1000ms, calculate `remaining = (durationMs + extendedMs) - (Date.now() - startedAt)`, display as `MM:SS`. When `remaining ≤ 0`, clear interval, check elapsed time:

- If ≤ 60s past expiry → auto-navigate to `/break-input`
- If > 60s past expiry → show expired session state (manual action required)

**Extension logic**: Add 5 _ 60 _ 1000 to `extendedMs`, write back to `localStorage`, continue countdown.

**Manual end**: Clear `localStorage`, navigate to `/break-input`.

**Auto-transition**: Same as manual end, but triggered by countdown reaching zero (within 60s window).

### UI Wireframe (sketch)

```
┌─────────────────────────────────────┐
│  PomoStretch                        │
│  Welcome, user@example.com   Sign out
├─────────────────────────────────────┤
│                                     │
│         ⏱️  24:37                    │  ← Big countdown
│                                     │
│    [+5 min]  [Zaczynaj przerwę]    │  ← Actions
│                                     │
└─────────────────────────────────────┘

(Idle state: replace countdown + buttons with [Start work session])
```

### Risks

| Risk                                                                               | Mitigation                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage` durability fails on some browsers (private mode, quota exceeded)    | Catch `localStorage` exceptions, fall back to in-memory state with a warning toast "Timer won't persist across refreshes". Mark this as known limitation, not blocker. |
| Countdown drift (interval accumulates milliseconds)                                | Recalculate remaining time from `Date.now()` on every tick, don't decrement a counter. This self-corrects drift.                                                       |
| User leaves tab in background → `setInterval` throttled → countdown appears frozen | On tab visibility change (`visibilitychange` event), recalculate remaining time immediately. This fixes display when user returns.                                     |
| Auto-transition races with manual navigation                                       | Check `remaining > 0` before allowing manual end; if countdown reaches zero first, cancel manual handler. Or: always clear interval + storage before any navigation.   |

### Handoff to Next Milestone

**M3 (Break Input)** receives navigation from M2 via `/break-input` route. The break-input page does not yet exist — M2 will navigate to a 404 or placeholder. M3 creates the actual page.

Before starting M3, validate M2:

1. Start a timer, refresh at 12 minutes remaining, confirm it resumes correctly
2. Start a timer, close tab, reopen within 10s, confirm it resumes
3. Start a timer, let it run to 00:00, confirm auto-navigation fires

## M3: Break Input & Keyword Matching

**Type**: Vertical slice  
**Estimated effort**: 3-4 hours  
**Blocks**: M4 (Exercise Selection)  
**Depends on**: M2 (Timer — entry point is timer expiry or manual end)  
**PRD coverage**: FR-010 through FR-013

### Outcome

New page at `src/pages/break-input.astro`. User lands here after ending a work session (manual or auto). Page offers:

- 4 quick-pick buttons: "Tylko oczy" / "Tylko kark" / "Ogólne" / "Zaskocz mnie"
- Free-text input field with placeholder "Co Cię boli? (opcjonalne)"
- "Skip break" button (navigates back to dashboard, starts new timer)

Submitting a quick-pick or free-text POSTs to `/api/break-input`, which stores the input + derived tags in a server-side cookie (short-lived, 5-min TTL), then redirects to `/exercise-sequence`. This avoids leaking break input in URL query params (better UX + prevents manual URL manipulation).

### Acceptance Criteria

- [x] `/break-input` route exists and is gated (requires auth)
- [x] Page displays 4 quick-pick buttons with Polish labels
- [x] Page displays free-text textarea (optional)
- [x] Page displays "Skip break" button
- [x] Clicking any quick-pick button submits form via POST to `/api/break-input`
- [x] Typing free-text and submitting POSTs to `/api/break-input`
- [x] `POST /api/break-input` handler derives tags via keyword matcher, stores `{ kind, value, tags }` in signed cookie `pomostretch.break_input`, redirects to `/exercise-sequence`
- [x] Cookie has 5-min expiry (enough for one exercise sequence, expires after)
- [x] Empty free-text + no quick-pick selection → show validation message "Wybierz przycisk lub wpisz tekst"
- [x] Keyword matcher at `src/lib/keyword-matcher.ts` extracts body-area tags from Polish + English keywords
- [x] Free-text with no recognized keywords falls back to `tags=general` (FR-012 graceful fallback)
- [x] "Skip break" navigates to `/dashboard`, clears any timer state, user is idle (ready to start new session)

### Quick-Pick Mappings

| Button Label | Derived Tags                                              |
| ------------ | --------------------------------------------------------- |
| Tylko oczy   | `['eyes']`                                                |
| Tylko kark   | `['neck']`                                                |
| Ogólne       | `['general']`                                             |
| Zaskocz mnie | `['random']` (signals rule engine to pick from all areas) |

### Keyword Matcher Logic

**Input**: free-text string (Polish or English), e.g., "kark od myszki, łokieć"  
**Output**: array of body-area tags, e.g., `['neck']`

**Algorithm** (case-insensitive substring match):

1. Split input into lowercase words
2. For each keyword list, check if any keyword substring exists in input
3. Collect matching tags, deduplicate
4. If result is empty, return `['general']`

**Keyword lists**:

- `eyes`: ["oczy", "oko", "eye", "eyes", "wzrok"]
- `neck`: ["kark", "szyja", "neck"]
- `shoulders`: ["ramiona", "ramię", "barki", "shoulder", "shoulders"]
- `lower_back`: ["plecy", "kręgosłup", "lędźwie", "back", "lower back", "spine"]

**Edge cases**:

- Input: "wszystko boli" → no specific keywords → `['general']`
- Input: "oczy i kark" → matches two lists → `['eyes', 'neck']`
- Input: "" (empty) → `['general']`

**Implementation location**: `src/lib/keyword-matcher.ts`, pure function, unit-testable.

### UI Wireframe

```
┌─────────────────────────────────────┐
│  Co Cię dzisiaj boli?               │
├─────────────────────────────────────┤
│  <form method="POST" action="/api/break-input">
│                                     │
│   [Tylko oczy]    [Tylko kark]     │  ← buttons with name="quick_pick"
│                                     │
│   [Ogólne]        [Zaskocz mnie]   │
│                                     │
│   ─────────────────────────────────│
│   Lub opisz słowami:                │
│   ┌───────────────────────────────┐│
│   │ Co Cię boli? (opcjonalne)     ││  ← textarea name="free_text"
│   │                               ││
│   └───────────────────────────────┘│
│   [Dalej]                           │  ← submit button
│  </form>                            │
│   ─────────────────────────────────│
│   [Pomiń przerwę]                   │  ← separate GET link
└─────────────────────────────────────┘
```

### API Handler: `POST /api/break-input`

**Body** (form-encoded):

- `quick_pick?: string` (one of: "Tylko oczy", "Tylko kark", "Ogólne", "Zaskocz mnie")
- `free_text?: string`

**Processing**:

1. Derive tags:
   - If `quick_pick` present → map to tags (`"Tylko kark"` → `['neck']`)
   - Else if `free_text` present → run keyword matcher → tags
   - Else → validation error "Wybierz przycisk lub wpisz tekst"
2. Store in signed cookie `pomostretch.break_input`:
   ```json
   {
     "kind": "quick_pick" | "free_text",
     "value": "<original input>",
     "tags": ["neck", "shoulders"],
     "expires_at": "<now + 5min>"
   }
   ```
3. Redirect 303 to `/exercise-sequence`

**Cookie config**: HttpOnly, Secure (prod), SameSite=Lax, Max-Age=300 (5 min)

### Risks

| Risk                                                                                     | Mitigation                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyword list is too narrow → many free-text inputs fall back to `general`                | Start with 5-7 keywords per body-area (PL + EN), validate against real usage post-deploy. This is a tuning knob, not a blocker.                                         |
| User types misspelled Polish (e.g., "karek" instead of "kark") → no match                | Substring match is forgiving (e.g., "kar" matches "kark"). Post-MVP: add fuzzy match (Levenshtein distance ≤2). For MVP, accept that misspellings → `general` fallback. |
| Free-text input is 10,000 chars → DoS risk                                               | Cap textarea at 500 chars client-side (`maxLength`) + server-side validation. Reject > 500 with 400 Bad Request.                                                        |
| User submits free-text with no quick-pick but expects a specific body-area → frustration | Show extracted tags in the UI after submission ("Wykryliśmy: kark, ramiona") before redirect. This is a UX enhancement, not MVP blocker. Deferred to post-MVP.          |
| Cookie manipulation (user edits signed cookie to inject tags)                            | Use Astro's signed cookie API (HMAC-based, tamper-proof). Invalid signature → treat as no cookie, redirect back to break-input.                                         |

### Handoff to Next Milestone

**M4 (Exercise Selection)** depends on reading the `pomostretch.break_input` cookie from M3. The tags drive the rule engine.

Before starting M4, validate M3:

1. Click "Tylko kark", confirm POST → redirect → `/exercise-sequence` loads
2. Check cookie in browser DevTools: `pomostretch.break_input` exists, expires in ~5 min
3. Type "oczy i plecy", submit, confirm cookie contains `tags: ["eyes", "lower_back"]`
4. Type "abcdefg" (no keywords), confirm cookie contains `tags: ["general"]`
5. Click "Pomiń przerwę", confirm navigation to `/dashboard` with no timer state

## M4: Exercise Selection & Sequence

**Type**: Vertical slice  
**Estimated effort**: 5-6 hours  
**Blocks**: US-01 completion  
**Depends on**: M1 (Exercise table), M3 (Break input provides tags)  
**PRD coverage**: FR-014 through FR-022, core business logic

### Outcome

New page at `src/pages/exercise-sequence.astro`. User lands here after submitting break input (via M3's POST/redirect). Page reads the `pomostretch.break_input` cookie, runs the rule engine to select 1-3 exercises, then displays them one at a time, each with:

- Exercise name + description
- Per-exercise countdown timer (30s-2min)
- "Done" button (marks complete, advances to next or end)
- "Skip" button (marks skipped, advances to next or end)

After the last exercise (or after skipping all), user sees "Resume work?" prompt. Confirming navigates to `/dashboard` and starts a new 25-min timer.

This milestone completes US-01 — the full pomodoro work-then-break-with-exercise cycle is now demoable end-to-end.

### Acceptance Criteria

- [ ] `/exercise-sequence` route exists and is gated
- [ ] Page reads `pomostretch.break_input` cookie on SSR, extracts `{ kind, value, tags }`
- [ ] If cookie missing/expired → redirect to `/break-input` (session expired)
- [ ] Rule engine at `src/lib/rule-engine.ts` selects 1-3 exercises from `exercise` table based on input tags
- [ ] Page displays first exercise with name, description, countdown (e.g., "45 seconds")
- [ ] "Done" button increments completed count, advances to next exercise or end prompt
- [ ] "Skip" button increments skipped count, advances to next exercise or end prompt
- [ ] Countdown reaches zero → auto-advance to next exercise (same as "Done")
- [ ] After last exercise, page shows "Resume work?" prompt with "Tak" / "Nie" buttons
- [ ] "Tak" navigates to `/dashboard`, starts new timer (calls same "Start" logic from M2)
- [ ] "Nie" navigates to `/dashboard`, user is idle
- [ ] Cookie is cleared after sequence ends (prevent replay)
- [ ] No-repeat rule: given `localStorage.getItem('pomostretch.lastSession')` contains previous exercise IDs, rule engine excludes them (FR-019)
- [ ] All 4 quick-pick inputs produce ≥1 exercise (validates FR-022 robustness, covered by M1 seed but enforced here)

### Rule Engine Logic

**Function signature**:

```typescript
selectExercises(params: {
  tags: string[];               // from break input
  lastSessionIds?: string[];    // from localStorage or DB
  catalog: Exercise[];          // fetched from Supabase
}): Exercise[]
```

**Algorithm**:

1. Filter catalog by tag match:
   - If `tags` includes `'random'` → use all exercises
   - Else → keep exercises where `body_areas` overlaps with `tags` (array intersection)
2. Apply no-repeat filter: exclude exercises with `id` in `lastSessionIds`
3. If result is empty after filters → fall back to `tags = ['general']` and retry (ensures FR-022)
4. Select 1-3 exercises:
   - If filtered set has ≤3 → return all
   - Else → randomly pick 3
5. Order by duration ascending (shortest first, better for engagement)
6. Return array

**Inputs**:

- `tags`: from cookie `pomostretch.break_input.tags` (array like `['neck', 'shoulders']`)
- `lastSessionIds`: read from `localStorage.getItem('pomostretch.lastSession')` (JSON array of UUIDs)
- `catalog`: `SELECT * FROM exercise` via Supabase client

**Outputs**:

- Array of 1-3 `Exercise` objects
- Store selected IDs in `localStorage.setItem('pomostretch.lastSession', JSON.stringify(ids))` after sequence ends

**Edge cases**:

- Empty catalog (dev error) → show error page "No exercises available"
- All exercises in catalog were in last session (rare, only if catalog size = 3) → allow repeat (log warning)
- Tag match yields 0 results before fallback → fallback to `general`, then if still 0 → error state

### Exercise Sequence State Machine

**States**: `LOADING` → `ACTIVE` (exercise N of M) → `COMPLETED` (Resume work? prompt)

**Transitions**:

- LOADING: fetch exercises via rule engine → ACTIVE(0)
- ACTIVE(N): Done/Skip/CountdownZero → ACTIVE(N+1) or COMPLETED
- COMPLETED: Yes → navigate to dashboard + start timer, No → navigate to dashboard idle

**Per-exercise state**:

```typescript
interface ExerciseState {
  exercise: Exercise;
  startedAt: number; // Date.now() when exercise began
  durationMs: number; // exercise.duration_seconds * 1000
  status: "active" | "done" | "skipped";
}
```

Track completed/skipped counts for future break_session record (M5 will persist these).

### UI Wireframe

**Happy path:**

```
┌─────────────────────────────────────┐
│  Ćwiczenie 1 z 3                    │
├─────────────────────────────────────┤
│                                     │
│  Neck Rolls                         │
│  Powoli obracaj głową w jedną       │
│  stronę, potem w drugą. 5 powtórzeń.│
│                                     │
│         ⏱️  00:42                    │  ← Per-exercise countdown
│                                     │
│    [Zrobione]      [Pomiń]          │
│                                     │
└─────────────────────────────────────┘

(After last exercise:)
┌─────────────────────────────────────┐
│  Dobra robota! 🎉                   │
│  Ukończyłeś 2 z 3 ćwiczeń.          │
│                                     │
│  Wracasz do pracy?                  │
│  [Tak]         [Nie, zostanę tu]    │
└─────────────────────────────────────┘
```

**Error states:**

```
(Loading state:)
┌─────────────────────────────────────┐
│  Przygotowujemy ćwiczenia...        │
│         🔄                           │
└─────────────────────────────────────┘

(Cookie expired/missing:)
┌─────────────────────────────────────┐
│  ⚠️ Sesja wygasła                   │
│  Wybierz swoje ćwiczenia ponownie.  │
│  [Powrót do wyboru]                 │
└─────────────────────────────────────┘

(Catalog fetch failed:)
┌─────────────────────────────────────┐
│  ❌ Nie można załadować ćwiczeń     │
│  Sprawdź połączenie i spróbuj       │
│  ponownie.                          │
│  [Spróbuj ponownie] [Powrót]        │
└─────────────────────────────────────┘

(Rule engine returned 0 exercises - should never happen if M1 seed correct:)
┌─────────────────────────────────────┐
│  ❌ Brak dostępnych ćwiczeń         │
│  Skontaktuj się z administratorem.  │
│  [Powrót do pulpitu]                │
└─────────────────────────────────────┘
```

### Risks

| Risk                                                                    | Mitigation                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule engine returns 0 exercises due to over-filtering → dead-end        | Fallback to `general` if tag match is empty, then if still empty → error page. Prevent this at M1 seed time by ensuring `general` has ≥2 exercises. Unit test R-04 covers this.                                         |
| No-repeat logic fails → same exercise twice in a row → user frustration | Unit test: given catalog of 3 exercises, last session had exercise A, ensure A is not in new selection. Store last session IDs in `localStorage` immediately after rule engine runs, not after user completes sequence. |
| Per-exercise countdown drifts or freezes (same risk as M2 timer)        | Use `Date.now()` recalc on every tick, handle tab visibility changes.                                                                                                                                                   |
| User refreshes mid-sequence → loses progress                            | Acceptable for MVP (sequence is 2-5 min, low cost to restart). Post-MVP: add `localStorage` checkpoint per exercise.                                                                                                    |
| Catalog fetch fails (Supabase down) → page crashes                      | Catch fetch error, show error page "Could not load exercises. Try again." with retry button.                                                                                                                            |

### Performance Budget (NFR-1)

Break content must load in < 1.5s p95 from break-input submission to first exercise visible.

**Budget breakdown**:

- M3 navigation → M4 SSR render: ~50ms (local)
- Supabase `SELECT * FROM exercise`: ~100ms (assuming nearby region, 12-15 rows)
- Rule engine + tag filtering: ~5ms (in-memory JS)
- Astro SSR → HTML sent to client: ~50ms
- Browser render first paint: ~50ms
- **Total**: ~255ms on fast path, well within 1.5s

**Validation**: Add server-side timing log in M4, measure end-to-end in local dev + staging. If > 1s observed, investigate:

- Catalog caching (fetch once, cache in memory for 5 min)
- Supabase query optimization (should be a table scan, no issue at 15 rows)

### Handoff to Next Milestone

**M5 (Break History CRUD)** will persist each completed break as a `break_session` row. M4 does not yet write to DB — it only reads the catalog. M5 adds the persistence layer.

Before marking M4 done, validate US-01 end-to-end:

1. Sign in → start timer → wait or manually end → click "Tylko kark" → see ≥1 neck exercise → mark Done → see "Resume work?" → click Yes → new timer starts
2. Repeat cycle, confirm no-repeat works (same exercise does not appear twice)
3. Try all 4 quick-picks, confirm each yields ≥1 exercise (R-04)

## M5: Break History CRUD

**Type**: Vertical slice  
**Estimated effort**: 6-8 hours  
**Blocks**: Certification requirement (domain CRUD with business logic)  
**Depends on**: M1 (break_session table), M0 (Auth for ownership)  
**PRD coverage**: FR-023 through FR-027, NFR-10

### Outcome

User can view, edit, and delete their past break sessions via:

1. New page at `src/pages/history.astro` — "Historia przerw"
2. Five CRUD API endpoints at `src/pages/api/sessions/`
3. Integration with M4 — after each exercise sequence, a `POST /api/sessions` creates a break_session record
4. Topbar link "Historia" between dashboard and sign-out

This milestone satisfies the certification requirement: **domain CRUD (break sessions are user-owned data) + non-empty business logic (the rule engine from M4 operates on this data via no-repeat rule)**.

### Acceptance Criteria

- [ ] `/history` route exists and is gated (added to `PROTECTED_ROUTES` in middleware)
- [ ] History page displays reverse-chronological list of user's break sessions (most recent first)
- [ ] Each session shows: date/time, input kind + value, derived tags, exercise names, completed/skipped counts, editable note field
- [ ] Empty state: "Nie masz jeszcze żadnych przerw. Wróć tu po pierwszym pomodoro."
- [ ] User can inline-edit the `note` field (textarea, ≤500 chars, auto-save on blur)
- [ ] User can delete a session (confirm dialog, then `DELETE /api/sessions/:id`)
- [ ] Deleted session disappears from list without page refresh
- [ ] `POST /api/sessions` endpoint creates a new record, returns `{ id, ...row }`
- [ ] `GET /api/sessions` endpoint returns paginated list (limit 20, cursor-based on `created_at`)
- [ ] `GET /api/sessions/:id` endpoint returns single record or 404 if not owned by user
- [ ] `PATCH /api/sessions/:id` endpoint updates `note` field (whitelist), returns updated row
- [ ] `DELETE /api/sessions/:id` endpoint hard-deletes record, returns 204
- [ ] All endpoints enforce RLS via Supabase client (user can only access their own rows)
- [ ] M4 exercise sequence end triggers `POST /api/sessions` with break payload
- [ ] Topbar shows "Historia" link for authenticated users

### API Endpoints

All under `src/pages/api/sessions/`:

#### `POST /api/sessions`

**Body**:

```json
{
  "input_kind": "quick_pick" | "free_text",
  "input_value": "Tylko kark",
  "derived_tags": ["neck"],
  "selected_exercise_ids": ["uuid1", "uuid2"],
  "completed_count": 2,
  "skipped_count": 0,
  "ended_at": "2026-07-10T18:30:00Z"  // ISO timestamp
}
```

**Returns**: `201 { id, user_id, created_at, ...body }`

**Validation**: zod schema, 500-char cap on `input_value`, tags array non-empty, exercise_ids length ∈ {1,2,3}.

#### `GET /api/sessions?limit=20&cursor=<timestamp>`

**Returns**:

```json
{
  "items": [{ id, created_at, input_value, derived_tags, ... }],
  "next_cursor": "2026-07-09T10:15:00Z"  // if more results exist
}
```

**Query**: `SELECT * FROM break_session WHERE user_id = auth.uid() AND created_at < cursor ORDER BY created_at DESC LIMIT 21` (fetch limit+1 to detect next page).

#### `GET /api/sessions/:id`

**Returns**: `200 { id, ...row }` or `404` if not owned.

#### `PATCH /api/sessions/:id`

**Body**: `{ note?: string, ended_at?: string, completed_count?: number, skipped_count?: number }`

**Returns**: `200 { id, ...updated_row }` or `404` if not owned.

**Whitelist**: only these 4 fields are updatable. Reject attempts to change `user_id`, `input_kind`, `selected_exercise_ids`.

#### `DELETE /api/sessions/:id`

**Returns**: `204` or `404` if not owned.

**Hard delete** (no soft-delete tombstone). Row is permanently removed.

### History Page UI Wireframe

**Happy path:**

```
┌─────────────────────────────────────┐
│  Historia przerw                    │
├─────────────────────────────────────┤
│                                     │
│  📅 2026-07-10, 14:30               │
│  Tylko kark                         │
│  Wykryte: kark                      │
│  Ćwiczenia: Neck Rolls, Chin Tucks │
│  ✅ 2 ukończone  ⏭️ 0 pominięte     │
│  ┌───────────────────────────────┐ │
│  │ Notatka: świetnie pomogło     │ │  ← Editable
│  └───────────────────────────────┘ │
│  [Usuń]                             │
│  ─────────────────────────────────  │
│                                     │
│  📅 2026-07-10, 10:15               │
│  Ogólne                             │
│  ...                                │
│                                     │
│  [Załaduj więcej]                   │
└─────────────────────────────────────┘

(Empty state: replace list with)
  "Nie masz jeszcze żadnych przerw.
   Wróć tu po pierwszym pomodoro."
```

**Error states:**

```
(Loading state:)
┌─────────────────────────────────────┐
│  Historia przerw                    │
├─────────────────────────────────────┤
│  Ładowanie...  🔄                   │
└─────────────────────────────────────┘

(Fetch failed - network error or Supabase down:)
┌─────────────────────────────────────┐
│  Historia przerw                    │
├─────────────────────────────────────┤
│  ❌ Nie można załadować historii    │
│  Sprawdź połączenie i odśwież       │
│  stronę.                            │
│  [Odśwież]  [Powrót do pulpitu]     │
└─────────────────────────────────────┘

(Save note failed - optimistic UI reverts:)
  Toast notification: "Nie udało się
  zapisać notatki. Spróbuj ponownie."
  (Note field reverts to previous value)

(Delete failed:)
  Toast notification: "Nie udało się
  usunąć sesji. Spróbuj ponownie."
  (Session remains in list)
```

### Integration with M4

At the end of M4's exercise sequence (after "Resume work?" prompt), before navigating to dashboard, fire `POST /api/sessions`:

```typescript
await fetch("/api/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input_kind: breakInput.kind,
    input_value: breakInput.value,
    derived_tags: breakInput.tags,
    selected_exercise_ids: exercises.map((e) => e.id),
    completed_count: completedCount,
    skipped_count: skippedCount,
    ended_at: new Date().toISOString(),
  }),
});
```

**Error handling**: If POST fails (network error, 500), show toast "Nie zapisaliśmy tej przerwy w historii — pozostała część działa normalnie". Do not block navigation. Retry once, then proceed.

**No-repeat data source switch**: M4 currently reads last session from `localStorage`. After M5, switch to `GET /api/sessions?limit=1` to fetch most recent session, extract `selected_exercise_ids`, pass to rule engine. Keep `localStorage` as a write-through cache for latency.

### Risks

| Risk                                                                                                 | Mitigation                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS policies misconfigured → user A sees user B's sessions (R-02, R-05)                              | Two-user integration test before marking M5 done. Create session as user A, attempt `GET /api/sessions` as user B, expect empty list.        |
| `POST /api/sessions` failure leaves UI inconsistent (M4 thinks it saved, history page shows nothing) | Optimistic UI: M4 proceeds regardless, history page shows error state on next visit. User can retry full cycle.                              |
| Pagination cursor logic breaks (off-by-one, duplicates)                                              | Use `created_at < cursor` (strict <, not ≤) in query. Test with exactly 20 sessions, confirm page 2 doesn't duplicate last item from page 1. |
| Note field XSS vulnerability                                                                         | Escape HTML in Astro template (`{note}` in Astro auto-escapes). No `set:html`. Validate 500-char limit server-side.                          |
| Hard delete loses audit trail                                                                        | Acceptable for MVP (solo user, low stakes). Post-MVP: add soft-delete `deleted_at` column if audit requirement emerges.                      |

### Tests (Deferred to M6)

This milestone introduces certification-critical test coverage:

- **R-02**: Integration test, two users, user A cannot `GET` user B's sessions
- **R-05**: Integration test, user B cannot `PATCH` or `DELETE` user A's session
- **R-13**: Integration test, `DELETE` then `GET`, expect 404

Implementation happens in M6, but risks are surfaced here.

### Handoff to Next Milestone

**M6 (Testing & Certification)** depends on M5 being complete — the CRUD endpoints must exist before writing integration tests against them.

Before starting M6, validate M5:

1. Complete a break session in M4, confirm it appears in `/history`
2. Edit the note field, reload page, confirm change persists
3. Delete a session, confirm it disappears
4. Create second user account, confirm they see empty history (not first user's sessions)

## M6: Testing & Certification

**Type**: Cross-cutting (wraps M4 + M5 + deployment)  
**Estimated effort**: 6-8 hours  
**Blocks**: Production-ready certification  
**Depends on**: M4 (US-01 complete), M5 (CRUD endpoints exist)  
**Test plan coverage**: R-01, R-02, R-03, R-04, R-05, R-13

### Outcome

Project meets certification minimum: **at least one test verifying functionality from the user's perspective, addressing a risk in test-plan.md**. Plus integration tests for access control and CRUD authorization.

Deliverables:

1. Test framework installed (Playwright for E2E, Vitest for integration/unit)
2. E2E test for US-01 (R-03) — full pomodoro cycle
3. Integration tests for R-01 (auth gating), R-02/R-05 (CRUD ownership), R-04 (rule engine robustness), R-13 (delete integrity)
4. CI pipeline extended with `test` job (runs on every PR)
5. Production deployment complete (Cloudflare Workers + Supabase production project)
6. Manual validation of Guardrails G1/G2/G3

### Acceptance Criteria

#### Test Framework Setup

- [ ] `package.json` includes `@playwright/test` and `vitest`
- [ ] `playwright.config.ts` configured for `http://localhost:4321` (Astro preview)
- [ ] `vitest.config.ts` configured for `src/**/*.test.ts`
- [ ] CI workflow `.github/workflows/ci.yml` has new job `test` after `build`

#### E2E Test (R-03)

- [ ] Test file `tests/e2e/pomodoro-cycle.spec.ts` exists
- [ ] Test signs in as test user, starts timer, manually ends, clicks "Tylko kark", sees ≥1 exercise, marks Done, sees "Resume work?", clicks Yes
- [ ] Test passes on local `npm run preview`
- [ ] Test passes in CI

#### Integration Tests

- [ ] `tests/integration/auth-gating.test.ts` (R-01): unauthenticated GET to `/dashboard` returns 302 redirect to `/auth/signin`
- [ ] `tests/integration/crud-ownership.test.ts` (R-02, R-05): two-user scenario, user A creates session, user B cannot GET/PATCH/DELETE it
- [ ] `tests/unit/rule-engine.test.ts` (R-04): given catalog seed, all 4 quick-pick inputs yield ≥1 exercise
- [ ] `tests/integration/delete-integrity.test.ts` (R-13): DELETE session, then GET by id, expect 404

#### Production Deployment

- [ ] ~~Cloudflare Worker deployed with correct name (`pomo-stretch`)~~ ✅ **Already deployed** (2026-06-09, live at https://pomo-stretch.michal3run.workers.dev)
- [ ] ~~Supabase production project created~~ ✅ **Already created** (cloud Supabase project, `auth.users` table operational)
- [ ] ~~Production secrets set via `wrangler secret put`~~ ✅ **Already configured** (`SUPABASE_URL` and `SUPABASE_KEY` set)
- [ ] ~~Auto-deploy wired via Cloudflare Workers Builds~~ ✅ **Already active** (push to `main` auto-deploys)
- [ ] Supabase migrations applied to production (M1 migrations: `exercise` + `break_session` tables)
- [ ] Production URL accessible with new product features (timer, break flow, exercises, history)
- [ ] Full US-01 cycle tested on production (manual smoke test)

**Note**: Infrastructure deployment (Phases 0-4 from deployment-plan.md) was completed on 2026-06-09. M6 deployment work focuses on applying M1 database migrations and verifying the new product features work end-to-end in production.

#### Manual Guardrail Validation

- [ ] G1 (NFR-1): Measure break-input submit to first exercise visible, confirm < 1.5s on staging
- [ ] G2: Test Skip button at every exercise, confirm no dead-ends
- [ ] G3 (NFR-2): Refresh page during active timer, confirm it resumes within ±2s

### Test Framework Choice

Per `test-plan.md` deferred decision:

- **E2E**: Playwright (browser-driven, standard in JS ecosystem)
- **Integration**: Vitest (fast, can import Astro route handlers directly)
- **Unit**: Vitest (same runner as integration)

**Supabase test instance**: Use local `supabase start` for integration tests. CI runs `supabase start` before test job, seed test data, run tests, tear down.

### Test Implementation Order

1. **R-04 (unit)** — rule engine robustness, fastest to write, validates M1 seed coverage
2. **R-01 (integration)** — auth gating, validates middleware
3. **R-03 (E2E)** — full cycle, certification minimum, highest value
4. **R-02/R-05 (integration)** — CRUD ownership, multi-user scenario
5. **R-13 (integration)** — delete integrity, quick win

Total: 5 test files, ~200-300 lines of test code.

### CI Pipeline Extension

Add `test` job to `.github/workflows/ci.yml`:

```yaml
jobs:
  lint: { ... }
  build: { ... }

  test:
    runs-on: ubuntu-latest
    needs: build
    services:
      supabase:
        # Use Supabase Docker container or `supabase start`
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx supabase start
      - run: npx vitest run
      - run: npx playwright install --with-deps
      - run: npm run preview &
      - run: npx playwright test
```

Tests must pass before merge to `main`.

### Production Deployment Checklist

**Infrastructure (already complete as of 2026-06-09)**:

- ✅ `wrangler.jsonc` name set to `pomo-stretch`
- ✅ CI workflow triggers on `main`
- ✅ `wrangler login` authenticated
- ✅ Production secrets configured (`SUPABASE_URL`, `SUPABASE_KEY`)
- ✅ First manual deploy succeeded (https://pomo-stretch.michal3run.workers.dev)
- ✅ Cloudflare Workers Builds connected to GitHub repo
- ✅ Auto-deploy on `main` verified working
- ✅ Supabase cloud project created, `auth.users` table operational

**M6 deployment work** (applies M1-M5 to production):

1. ~~**Fix config bugs**~~ (already done):
   - ✅ `wrangler.jsonc`: name already set to `pomo-stretch`
   - ✅ CI workflow: already uses `main` branch

2. ~~**Authenticate wrangler**~~ (already done): ✅ `npx wrangler login`

3. ~~**Set production secrets**~~ (already done):
   - ✅ `SUPABASE_URL` and `SUPABASE_KEY` configured

4. **Deploy Supabase migrations** (M1 work):
   - Create `exercise` table migration
   - Create `break_session` table migration
   - Run `npx supabase db push --project-ref <prod-ref>` against production Supabase
   - Validate: `SELECT COUNT(*) FROM exercise` returns ≥12

5. **Deploy product features** (M2-M5 work):
   - Merge M2 (timer), M3 (break input), M4 (exercise selection), M5 (history CRUD) to `main`
   - Cloudflare Workers Builds auto-deploys on push
   - No manual `wrangler deploy` needed (already automated)

6. **Smoke test**: Visit production URL, sign up, complete one pomodoro cycle, check history page

7. ~~**Wire auto-deploy**~~ (already done): ✅ Cloudflare Workers Builds active

### Risks

| Risk                                                                         | Mitigation                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| E2E tests flaky (timing issues, animation delays)                            | Use Playwright `waitForSelector` with explicit timeouts. Avoid `page.waitForTimeout(1000)` arbitrary sleeps.                      |
| CI `supabase start` fails (port conflict, Docker issues)                     | Use GitHub Actions service container for Postgres, or Supabase Cloud ephemeral project (via `SUPABASE_TEST_PROJECT_REF` env var). |
| Test data pollutes production (accidentally ran tests against prod Supabase) | Hard-code test Supabase URL in test config, fail loudly if env var `SUPABASE_URL` starts with prod domain.                        |
| Deployment fails due to missing secret (forgot `wrangler secret put`)        | Pre-flight check: `wrangler secret list`, expect `SUPABASE_URL` and `SUPABASE_KEY` present.                                       |
| Worker deployed under wrong name → 404 on custom domain                      | Validate `wrangler.jsonc` name field before first deploy. Check `wrangler deployments list` after deploy.                         |

### Guardrail Validation Protocol

**G1 (NFR-1: < 1.5s latency)**:

- Open browser DevTools Network tab
- Complete a pomodoro work session, end manually
- Click "Tylko kark" on break-input
- Measure: time from click to first exercise name visible
- **Pass criterion**: ≤ 1500ms on 3/3 attempts from same region as Supabase project

**G2 (User agency: skip without dead-ends)**:

- Start exercise sequence with 3 exercises
- Click "Skip" on first → expect second exercise visible
- Click "Skip" on second → expect third exercise visible
- Click "Skip" on third → expect "Resume work?" prompt visible
- **Pass criterion**: No error pages, no stuck states, always advances

**G3 (NFR-2: Timer durability)**:

- Start 25-min timer
- Wait until 12:00 remaining
- Hard refresh (Ctrl+Shift+R)
- **Pass criterion**: Timer resumes at 12:00 ± 2 seconds
- Repeat with tab close + reopen within 10s
- **Pass criterion**: Timer resumes correctly

### Handoff to Certification

After M6 completes:

- All tests pass in CI
- Production deployment live
- Guardrails validated manually
- Documentation complete (`README.md` updated with production URL, test commands)

Project is ready for certification submission.

## Unknowns & Open Questions

Surfaced during roadmap planning, not yet resolved:

### U1: Exercise Catalog Seed Size & Quality

**Question**: How many exercises needed to robustly cover FR-022 (every quick-pick yields ≥2 exercises)?

**Current best guess**: 12-15 exercises, distributed as:

- Eyes: 2-3 (e.g., 20-20-20 rule, palming, eye circles)
- Neck: 2-3 (e.g., neck rolls, chin tucks, side stretches)
- Shoulders: 2-3 (e.g., shoulder shrugs, arm circles, doorway stretch)
- Lower back: 2-3 (e.g., seated spinal twist, cat-cow, standing side bend)
- General: 2-3 (e.g., deep breathing, stand and stretch, wrist rolls)

**Unknown**: Writing quality exercise descriptions (50-200 chars, clear, safe, original) is **creative work**, not code generation. Estimated 1.5-2h of M1's 3-4h budget, but actual time may vary based on research depth.

**Owner**: Solo developer (manual task, not delegable to agent)  
**Resolution deadline**: M1 completion (blocks M4)

### U2: Test Framework Integration Complexity

**Question**: How difficult is Playwright + Vitest integration with Astro 6 SSR + Cloudflare workerd + local Supabase?

**Current best guess**: Standard JS stack, well-documented. Vitest works out-of-box, Playwright requires `@astrojs/test-utils` or manual preview server setup.

**Unknown**: CI integration with `supabase start` (Docker + port binding + seed data) may have GitHub Actions quirks not visible in local dev.

**Owner**: Deferred to M6  
**Resolution deadline**: M6 test setup phase (first 2h)

### U3: NFR-1 Latency Budget in Production

**Question**: Will < 1.5s break-content delivery hold in production (Cloudflare Workers edge + Supabase free tier)?

**Current best guess**: Yes — rule engine is in-memory JS (~5ms), catalog fetch is 12-15 rows (~100ms from nearby region), SSR render ~50ms. Total ~255ms, well within budget.

**Unknown**: If Supabase project region is far from primary users (e.g., EU user hitting US-east Supabase), cross-region latency could add 200-500ms. May need catalog caching at edge or region migration.

**Owner**: Validation task in M6 guardrail testing  
**Resolution deadline**: M6 manual validation, post-deploy measurement

### U4: localStorage Persistence Across Browser Variants

**Question**: Does `localStorage` reliably persist timer state (NFR-2) across all target browsers (Chrome, Firefox, Safari, Edge)?

**Current best guess**: Yes in normal mode. Fails in private/incognito mode (expected limitation).

**Unknown**: Safari's ITP (Intelligent Tracking Prevention) sometimes clears `localStorage` aggressively. May need to switch to `sessionStorage` for Safari or accept degraded durability.

**Owner**: Manual browser testing in M6  
**Resolution deadline**: M6 guardrail validation (G3)

## Risk Register

Ordered by likelihood × impact, sourced from milestone-level risks:

| ID      | Risk                                                                                                 | Likelihood | Impact | Milestone | Mitigation                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------- | ---------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1**  | Rule engine edge case (empty catalog subset after filters) returns 0 exercises → dead-end            | Medium     | High   | M4        | Fallback to `general` tag if initial match is empty. Unit test R-04 validates all 4 quick-picks. Seed must include ≥2 `general` exercises (enforced in M1).                                |
| **R2**  | RLS policies misconfigured → user A sees/edits user B's break sessions                               | Medium     | High   | M5        | Two-user integration test (R-02, R-05) before marking M5 done. Manual validation: create session as user A, sign in as user B, expect empty history.                                       |
| **R3**  | Timer state durability (NFR-2) fails on page refresh → lost progress, user frustration               | Medium     | Medium | M2        | Recalculate remaining time from `Date.now() - startedAt` on mount, not decrementing counter. Catch `localStorage` exceptions, fall back to in-memory state + warning toast. Test G3 in M6. |
| **R4**  | Exercise descriptions are low-quality (copy-pasted, unclear, unsafe) → user injury or IP issue       | Low        | High   | M1        | Write original descriptions (not verbatim from any source). Consult ergonomic guidelines, keep instructions simple. Flag high-risk movements (e.g., deep backbends) for post-MVP review.   |
| **R5**  | Keyword matcher too narrow → most free-text inputs fall back to `general`, defeating personalization | Medium     | Medium | M3        | Start with 5-7 PL+EN keywords per body-area. Post-MVP: add fuzzy match (Levenshtein ≤2). Accept that MVP has limited vocabulary, surface this in lessons.md.                               |
| **R6**  | NFR-1 latency budget violated in production (Supabase region mismatch)                               | Low        | Medium | M4, M6    | Pick Supabase region near primary users (EU if user is EU-based). Measure G1 post-deploy. If > 1.5s, add catalog caching at edge (Workers KV, 5-min TTL).                                  |
| **R7**  | E2E tests flaky in CI (timing issues, animation delays)                                              | Medium     | Low    | M6        | Use Playwright `waitForSelector` with explicit conditions, avoid arbitrary `waitForTimeout`. Retry failed tests once (Playwright built-in retry).                                          |
| **R8**  | Production deploy fails due to missing secrets → 500 errors on first visit                           | Low        | Medium | M6        | Pre-flight checklist: `wrangler secret list` before deploy. Add startup config check (existing `src/lib/config-status.ts`) to fail loudly if secrets missing.                              |
| **R9**  | `localStorage` cleared by browser (Safari ITP, user action) → timer state lost mid-session           | Low        | Low    | M2        | Acceptable degradation for MVP. Show warning if `localStorage` unavailable ("Timer won't persist"). Post-MVP: server-side session state.                                                   |
| **R10** | Hard delete of break_session loses audit trail → post-incident forensics impossible                  | Low        | Low    | M5        | Acceptable for MVP (solo user, low stakes). Post-MVP: add soft-delete `deleted_at` column if audit requirement emerges.                                                                    |

**Risk thresholds**:

- High impact + Medium/High likelihood → **must mitigate before marking milestone done**
- Medium impact + Medium likelihood → **mitigate or document as known limitation**
- Low impact or Low likelihood → **accept or defer to post-MVP**

## Deferred to Post-MVP

From PRD `## Non-Goals` and roadmap scoping:

### Post-MVP Features (functional)

1. Voice / microphone input for break input (Non-Goal #1)
2. Out-of-tab browser notifications when timer fires (Non-Goal #2)
3. Generated images/GIFs for exercises (Non-Goal #3)
4. Streaks, gamification, weekly stats dashboards (Non-Goal #4)
5. Native mobile apps (Non-Goal #5)
6. Social / sharing features (Non-Goal #6)
7. Admin role and role-based capability matrix (Non-Goal #7)
8. Email verification, password reset, magic-link login (Non-Goal #8)
9. Third-party OAuth identity providers (Non-Goal #9)
10. Multi-device user-state sync (timer + history) (Non-Goal #10)
11. Configurable pomodoro durations (Non-Goal #11)
12. LLM-powered free-text extraction (replaces keyword matcher) (NFR-6, NFR-7, NFR-8, NFR-9)
13. Pain-memory bias rule (historical break data influences future recommendations)
14. Exercise intensity dimension (catalog tags + input parsing for "gentle" vs "intense")

### Post-MVP Quality / Compliance (non-functional)

15. Full WCAG-AA accessibility compliance (Non-Goal #12)
16. GDPR cookie banner / consent flow (Non-Goal #13)
17. Real-time multi-user sync, multi-region SLA (Non-Goal #14)
18. Full internationalization with locale switching (Non-Goal #15)
19. **Mobile/responsive design and viewport optimization** — MVP targets desktop-only (1024px+ viewports). The persona is "desk-worker at one machine" (PRD), and all wireframes assume desktop width. No mobile breakpoints, no touch optimization, no viewport meta tags beyond defaults. Revisit post-MVP if usage data shows mobile access > 5%.
20. Soft-delete for break_session (audit trail)
21. Advanced RLS (row-level encryption, audit logs)
22. Fuzzy keyword matching (Levenshtein distance ≤2)
23. Catalog caching at edge (Workers KV) unless NFR-1 violated

### Rationale

MVP focuses on **vertical slice completeness** — one full user cycle (US-01) demoable end-to-end with certification-quality CRUD and tests. Feature breadth (configurability, multi-device, gamification) is deliberately deferred to keep scope within 3-week / 30-35h after-hours budget.

## Backlog Handoff

Each milestone below is **backlog-ready** — scope, acceptance criteria, dependencies, and risks are explicit. The next step (Module 2, Lesson 2) is creating a `context/changes/<change-id>/` folder for each milestone using `/10x-new` and writing per-change implementation plans.

### Milestone-to-Change Mapping (Proposed)

| Milestone | Suggested change-id           | Type          | Status                                                      |
| --------- | ----------------------------- | ------------- | ----------------------------------------------------------- |
| M0        | `bootstrap`                   | Vertical      | ✅ Complete (existing)                                      |
| M1        | `database-schema-catalog`     | Horizontal    | Ready for `/10x-new`                                        |
| M2        | `pomodoro-timer`              | Vertical      | Ready for `/10x-new` (can start in parallel with M1)        |
| M3        | `break-input-flow`            | Vertical      | Blocked by M2                                               |
| M4        | `exercise-selection-sequence` | Vertical      | Blocked by M1, M3                                           |
| M5        | `break-history-crud`          | Vertical      | Blocked by M1 (can start after M1 complete, parallel to M4) |
| M6        | `testing-certification`       | Cross-cutting | Blocked by M4, M5                                           |

**Stable identifiers**: Use the suggested `change-id` values above when creating change folders. These will become load-bearing references in PRs, commit messages, and `contract-surfaces.md`.

### Handoff Checklist per Milestone

Before marking a milestone "done" and handing off to the next:

**M1 → M4, M5**:

- [ ] Both migrations applied to local + staging Supabase
- [ ] Seed data coverage validated: all 4 quick-picks match ≥2 exercises
- [ ] RLS policies tested with two users
- [ ] `exercise` and `break_session` tables queryable

**M2 → M3**:

- [ ] Timer starts, counts down, displays MM:SS
- [ ] +5 min extension works
- [ ] Manual end ("Zaczynaj przerwę") navigates to `/break-input`
- [ ] Auto-transition at 00:00 navigates to `/break-input`
- [ ] Page refresh during active timer restores state

**M3 → M4**:

- [ ] `/break-input` page renders
- [ ] All 4 quick-picks navigate to `/exercise-sequence` with correct query params
- [ ] Free-text input with recognized keywords derives correct tags
- [ ] Free-text with no keywords falls back to `general`
- [ ] "Skip break" navigates to `/dashboard` idle

**M4 → M6** (US-01 complete):

- [ ] Full cycle demoable: sign in → start timer → end → click "Tylko kark" → see exercise → Done → Resume work
- [ ] No-repeat rule tested: same exercise does not appear twice in consecutive breaks
- [ ] All 4 quick-picks produce ≥1 exercise (R-04)

**M5 → M6**:

- [ ] `/history` page shows break sessions
- [ ] Note field editable, persists across reloads
- [ ] Delete removes session
- [ ] Two-user test: user A's sessions invisible to user B

**M6 → Production**:

- [ ] All tests pass in CI
- [ ] ~~Production Worker deployed with correct name~~ ✅ Already deployed (https://pomo-stretch.michal3run.workers.dev)
- [ ] Supabase production migrations applied (M1: `exercise` + `break_session` tables)
- [ ] ~~Secrets configured~~ ✅ Already configured
- [ ] Guardrails G1/G2/G3 validated manually
- [ ] Smoke test: full US-01 cycle on production URL

### Backlog Priority Order

**Critical path** (must complete sequentially for US-01):

1. M1 (Database Schema)
2. M2 (Pomodoro Timer) — can overlap with M1
3. M3 (Break Input)
4. M4 (Exercise Selection)

**Certification path** (can parallelize after M1): 5. M5 (Break History CRUD) — start after M1, parallel to M2/M3/M4 6. M6 (Testing & Certification) — wraps M4 + M5

**Recommended implementation order** (considers parallelization):

- Week 1: M1 + M2 (both can start immediately)
- Week 2: M3, then M4 + M5 (M5 starts when M1 done, runs parallel to M4)
- Week 3: M6 (testing, deployment, manual validation)

## Update Protocol

This roadmap is a **living document** — it evolves as implementation reveals unknowns or forces scope changes.

### When to update

- **Milestone scope change** (e.g., M4 adds a feature not in original plan) → update the milestone's Acceptance Criteria, add a row to Risk Register, note change in History below
- **Dependency change** (e.g., M5 no longer blocked by M4) → update Dependency Graph, reorder Backlog Priority
- **New unknown surfaces** → append to `## Unknowns & Open Questions` with owner + deadline
- **Risk realized** (e.g., R6 NFR-1 violated in prod) → update Risk Register with outcome, move mitigation from "planned" to "implemented"
- **Milestone completes** → update Backlog Handoff checklist, record completion date in History

### What NOT to update

- **Per-change implementation details** — those live in `context/changes/<change-id>/plan.md`, not here
- **Code-level decisions** (e.g., which React state hook to use) — those are implementation notes, not roadmap scope
- **Test code specifics** (e.g., Playwright selector strategies) — covered in M6 change folder or test files

### Version History

- **2026-07-10**: Initial roadmap (v1). Six milestones sequenced, dependencies graphed, risks registered. Baseline: auth complete, no product features yet.
- **2026-07-11**: Corrected deployment status throughout document. Infrastructure deployment (Phases 0-4 from deployment-plan.md) was completed 2026-06-09 — production live at https://pomo-stretch.michal3run.workers.dev, Supabase project operational, auto-deploy active. Roadmap milestone M6 now focuses on M1 database migrations + product feature validation, not infrastructure setup.

---

## M7: UAT & Feedback Polish (Post-MVP)

**Status**: planned
**Dependencies**: M1-M6

### Goals

- Address user feedback logged in `context/foundation/uat-feedback.md` during manual testing.

### Deliverables

- **FR-030 (Enhancement)**: Add client-side dictionary to translate database `body_areas` tags (e.g., `eyes`) to localized badges (e.g., `Oczy`) in `ExerciseSequence.tsx`.
- **FR-031 (Enhancement)**: Add in-tab notification (audio chime and `document.title` update) when the 25-minute pomodoro timer expires.
- **FR-032 (Enhancement)**: Add an optional "Idle Break" timer (e.g., 3, 5, 10 minutes) on the post-exercise screen, allowing users to rest before starting the next 25-minute session.
- **FR-033 (Enhancement)**: Add an `image` column to the `exercise` table, upload SVG visualizations to `public/images/`, and expand the database seed to 24 exercises (from external `exercises.seed.json`).
- **R-08**: Expand seed catalog with more exercises per body area to enable engine randomization (currently disabled due to <3 exercises per category).

### Handoff

- M7 complete: Exercises show Polish badges, timer makes a subtle sound upon expiry, and users can opt to run a 3-10 minute idle break after finishing exercises.

---

**Roadmap complete.** Next step: `/10x-new <change-id>` to create per-milestone implementation plans.
