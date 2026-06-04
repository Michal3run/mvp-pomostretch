---
project: PomoStretch
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-07-05
  after_hours_only: true
created: 2026-05-24
updated: 2026-06-04
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: pain category
      decision: workflow friction + decision paralysis + missing capability (triple-overlap)
    - topic: insight defensibility
      decision: "moat is composition: pomodoro work-cycle × pain-aware tagged catalog × low-friction input × no-repeat memory"
    - topic: primary persona scope
      decision: single named user including yourself (project author)
    - topic: access model
      decision: email + password, flat single role, server-side session tokens, multi-device for auth (not for user-state)
    - topic: email infrastructure for T1
      decision: deferred to T2+; no verification, no password reset, no magic-link in T1
    - topic: password storage
      decision: salted hash via OWASP-current algorithm (Argon2id or bcrypt cost ≥ 12); plaintext never persisted
    - topic: admin role
      decision: none in T1; re-evaluate at T3+
    - topic: T1 scope discipline
      decision: "Path A scope-down — drop LLM (A1), drop session DB persistence (A2), hardcode pomodoro defaults (A4), 10–15 exercises in seed (A5); LLM and richer features defer to T2+"
    - topic: data persistence architecture
      decision: localStorage primary for user-state (timer, break history, pain-memory data); DB server-side only for auth and exercise catalog; multi-device user-state sync deferred to T3+
    - topic: timeline budget
      decision: "mvp_weeks=3 with 1-week margin; realistic effort 7–13h with author's .NET+React experience and AI assistance"
    - topic: distinction-criteria ambition
      decision: "aim for above-baseline — certification minimum (auth + DB CRUD + business logic + PRD + ≥1 user-flow test + CI/CD) plus one polish element plus clean demo plus working public deploy; not a moonshot"
    - topic: localStorage-as-primary user-state acceptability
      decision: "DB CRUD via auth + exercise catalog satisfies course requirement #2 (data management); localStorage is additional device-local cache, not the only persistence; requirement met"
    - topic: socrates round on FRs
      decision: "all 22 FRs kept as written; two new open questions surfaced (hide-countdown toggle T3+, exercise intensity dimension T2+)"
    - topic: business logic shape
      decision: "T1 rule = body-area tag match + no-repeat across adjacent breaks; T2+ adds pain-memory bias from recent break history; rule engine output 1–3 ordered exercises with name/description/duration"
    - topic: graceful-degradation NFR
      decision: "added NFR-9 — keyword fallback if pain-extraction service unavailable, no error to user; defense-in-depth for T2+ when LLM endpoint lands"
    - topic: product framing (PRD frontmatter)
      decision: "product_type=web-app, target_scale.users=small (qps=low, data_volume=small), hard_deadline=2026-07-05 (1st cert deadline; submission feedback by 07-19, 2nd window 08-10 for revisions), after_hours_only=true"
    - topic: non-goals scope
      decision: "15 non-goals locked — 11 functional + 4 non-functional, all reflecting prior phase decisions; voice/notifications/images/gamification/native/social/admin/email-infra/oauth/multi-device/configurable-pomodoro plus AA/GDPR/realtime/i18n"
    - topic: tech-stack selection (m1l2 / 10x-tech-stack-selector)
      decision: "10x-astro-starter (Astro 6 + React 19 + TypeScript + Tailwind 4 + Supabase + Cloudflare Pages/Workers); standard path; deploy cloudflare-pages; CI github-actions auto-deploy-on-merge; project_name pomo-stretch; full-stack opinionated single-repo replacing the originally-volunteered .NET backend + separate React frontend split; locked at context/foundation/tech-stack.md"
  frs_drafted: 22
  quality_check_status: accepted
---

# Shape Notes — PomoStretch

> Working notes from `/10x-shape` discovery. Phases append below as they complete.
> Source draft: `../../10xdevs-notes/scratch/mvp-ideas.md` (read but not auto-folded — every section here reflects user-confirmed answers).

## Vision & Problem Statement

Solo desk-workers — programmers, analysts, writers, students grinding theses — spend 6–10 hours daily at one machine. Discomfort in neck, shoulders, wrists, eyes, and lower back accumulates over a week from transient signal into a constant baseline. Existing pomodoro timers (Pomofocus, Forest, brain.fm) ring at break time but provide no break content; existing stretching apps (Stretchly, StretchClock) offer static or randomized exercise lists with no memory of what the user feels today; YouTube searches for "5 min desk stretches" take longer than the break itself. The current behavior is either passive (scroll a phone, wait out the timer, return to the desk in worse shape) or overshooting (reactive trip to physiotherapy or gym after a week of accumulated damage).

Break content must match the user's current state, not a generic weekly plan — and capturing that state must take seconds, not minutes. A pomodoro timer that prescribes "10 squats" to someone whose neck hurts produces zero compliance; the same timer offering 30 seconds of neck rolls plus shoulder shrugs plus eye relaxation produces actual behavior change because it targets what hurts now. The inputs to that decision are predictable enough for quick-pick buttons (eyes / neck / shoulders / lower back / "general") to cover the typical case, with a free-text fallback for nuance the buttons miss ("right shoulder only when using the mouse for two days"). The moat is composition — pomodoro work-cycle × pain-aware tagged catalog × low-friction input × no-repeat memory across breaks. Each element exists separately in some product; no product combines them in one flow.

## User & Persona

### Primary

Solo desk-worker — programmer, analyst, writer, or grad student — working 6–10 hours per day at one machine. Knows in principle that they should move during breaks, but at the moment a pomodoro timer fires has no decision energy left to choose what to do. Reaches for this product when a pomodoro break starts and they need something specific to do for the next five minutes that targets where it hurts today, with input that takes one tap or one short sentence. The first user is the author of this project.

## Success Criteria

### Primary

User completes a full pomodoro work-then-break-with-exercise cycle from sign-in to "Resume work?" prompt — break content (1–3 exercises matched to user input) is delivered without dead-ends, demoable end-to-end on a fresh laptop in a single session.

### Secondary

Catalog robustness — every quick-button selection always yields ≥1 exercise from the seed catalog, including edge combos like "Tylko oczy" + minimal break duration. The rule engine + tag schema cover the realistic input space, not just the happy-path neck-pain + 5-min break combo.

### Guardrails

- **Break loading performance** — from timer-fire to first exercise visible: < 1.5s p95 end-to-end. The 5-minute break must not shrink to 4 because of loading time.
- **User agency** — every break-flow screen has a skip / end-break / dismiss affordance. The user is never trapped in an exercise sequence they did not request, and partial completion (Done at 50%) is always valid.
- **Pomodoro state durability** — active work-timer state survives page refresh and browser tab close-and-reopen within ~30 seconds, backed by `localStorage`. Accidental Ctrl+R during a 24th-minute work session does not lose the session.

## Access Control

Single role (flat); every authenticated user has identical capabilities. No admin tier in the MVP.

**Sign-up:** email + password (server-side; password stored only as a salted hash using an OWASP-current algorithm — Argon2id or bcrypt cost ≥ 12). No email verification step in the MVP — accounts are usable immediately.

**Sign-in:** email + password against the stored hash. Successful sign-in issues a server-side session token; the same account can be active on multiple devices (auth state syncs; user-state — timer, break history, pain-memory — does not, by design).

**Unauthenticated access:** every product feature (timer, break screen, exercise sequence) is gated. An unauthenticated request to any gated route redirects to sign-in.

**Out of MVP scope (deferred):** email verification, password reset flow, magic-link login, Google / OAuth providers, admin role, role-based capability matrix, multi-device user-state sync. Each appears in `## Non-Goals` (Phase 6) or the forward block below.

## Functional Requirements

### Authentication

- FR-001: User can register with email + password from a sign-up form. Priority: must-have
  > Socrates: Counter-argument considered: "Single-user MVP doesn't need registration; a hardcoded admin user is enough." Resolution: kept; course requirement #1 (access control) is explicit, hardcoded would force config-edit per laptop and reads as anonymous demo to evaluators.

- FR-002: User can sign in with email + password from a sign-in form. Priority: must-have
  > Socrates: Counter-argument considered: "Persistent JWT/cookie means the user signs in once and never again; second-time sign-in is dead capability." Resolution: kept; cookies expire (7–30 days standard) and FR-003 sign-out triggers re-authentication.

- FR-003: User can sign out, invalidating the active session token on the server. Priority: must-have
  > Socrates: Counter-argument considered: "Solo app on personal laptop — sign-out is dead UX." Resolution: kept; multi-device safety (borrowed laptop, public browser, demo on someone else's machine), course evaluator expects.

- FR-004: An unauthenticated request to any gated route redirects to the sign-in screen. Priority: must-have
  > Socrates: Counter-argument considered: "401 error is enough; redirect adds routing logic." Resolution: kept; redirect is product-level UX, 401 is ops-level. SPA tooling (React Router) provides redirect at zero cost.

### Pomodoro Timer

- FR-005: User can start a 25-minute work session from the dashboard. Priority: must-have
  > Socrates: Counter-argument considered: "Hardcoded 25 minutes ignores users with different work cadences (ADHD, deep flow, varied tasks)." Resolution: kept for T1; configurability deferred to T3+ per A4 scope-down, surfaced in `## Non-Goals`.

- FR-006: User sees a live countdown of the remaining work-session time. Priority: must-have
  > Socrates: Counter-argument considered: "Live countdown generates anxiety / clock-watching, lowering productivity." Resolution: kept; visible progress is core to pomodoro psychology — without it, no sense of session arc. Hide-toggle is a T3+ option (see OQ3).

- FR-007: User can extend the active work session by +5 minutes. Priority: must-have
  > Socrates: Counter-argument considered: "+5 min undermines pomodoro discipline; every extension is procrastination." Resolution: kept; serves as data input for T3+ adaptive-break business logic (3× +5min → suggest longer break) — without FR-007, that future feature has no signal. G2 user agency.

- FR-008: User can manually end the work session early and proceed to the break-input screen ("Zaczynaj przerwę"). Priority: must-have
  > Socrates: Counter-argument considered: "Manual break-start is anti-pattern; pomodoro discipline says timer rules, not user mood." Resolution: kept; real-world interrupts (meetings, lunch, urgent ping) > 0%. Forced timer in those moments = abandoned app. G2 agency.

- FR-009: When the work-session countdown reaches zero, the app automatically transitions to the break-input screen. Priority: must-have
  > Socrates: Counter-argument considered: "Auto-transition disrupts user mid-thought; should require 'Continue?' confirmation." Resolution: kept; auto-transition is the pomodoro contract — gentle forced break is the value. User mid-thought has FR-007 (+5min). Manual confirmation defeats the boundary discipline.

### Break-Input Flow

- FR-010: User can submit one of 4 quick-pick selections (Tylko oczy / Tylko kark / Ogólne / Zaskocz mnie) on the break-input screen to proceed to the exercise sequence. Priority: must-have
  > Socrates: Counter-argument considered: "4 buttons is arbitrary middle — either 1 (Zaskocz mnie alone) or 8+ (full body-area enumeration)." Resolution: kept; 4 covers Pareto desk-pain categories from ergonomic research plus an escape (Zaskocz mnie). 1 removes personalization; 8+ re-introduces decision paralysis. Re-evaluate empirically T3+.

- FR-011: User can submit free-text describing what hurts; in T1 the input is parsed by case-insensitive keyword substring matching against a curated Polish + English keyword list to derive body-area tags. Priority: must-have
  > Socrates: Counter-argument considered: "T1 has no LLM — free-text with keyword match is theatre; drop the input field, leave only buttons." Resolution: kept; field is the upgrade hook for T2 LLM swap-in. Removing it now adds UI rework + user confusion in T2.

- FR-012: User who submits free-text that does not match any known keyword still receives an exercise sequence — system falls back to a "general" tag selection rather than returning empty / error. Priority: must-have
  > Socrates: Counter-argument considered: "Should show explicit 'didn't understand' error to teach the user the keyword vocabulary." Resolution: kept; error path penalizes users with imperfect spelling / slang — graceful degradation is preferable. T2 LLM resolves fully.

- FR-013: User can skip the entire break and proceed directly to a new work session ("Skip break"). Priority: must-have
  > Socrates: Counter-argument considered: "Skip-break wipes the health value of pain-aware product; should impose limit (max 2 skips/day) or justification dialog." Resolution: kept; limit/dialog is paternalistic UX, breaks G2. Skip-tracking → T3+ analytics nudge, not T1 enforcement.

### Exercise Sequence

- FR-014: User receives a sequence of 1–3 exercises selected by the rule engine after submitting break input. Priority: must-have
  > Socrates: Counter-argument considered: "Variable count creates inconsistent UX; fix at always 3." Resolution: kept; variable adapts to break time budget, available tag matches, and T3+ adaptive-break behavior. Fixed 3 forces filler exercises when quality matches < 3.

- FR-015: User sees each exercise displayed with name, short description, and a per-exercise countdown timer. Priority: must-have
  > Socrates: Counter-argument considered: "Per-exercise countdown is granular noise; a single 5-min break-timer is enough." Resolution: kept; bounded micro-targets (30s, 1m, 30s) drive higher compliance than amorphous 5-min blocks per behavioral-design research.

- FR-016: User can mark the current exercise as Done to advance to the next exercise (or end the sequence if it's the last). Priority: must-have
  > Socrates: Counter-argument considered: "Auto-advance when countdown hits zero is enough; Done button is redundant tap." Resolution: kept; Done = "completed it" semantic distinct from Skip. T3+ analytics distinguishes compliance %. User may finish faster than countdown (5 reps in 20s) and tap Done.

- FR-017: User can Skip the current exercise to advance to the next exercise (or end the sequence if it's the last). Priority: must-have
  > Socrates: Counter-argument considered: "Skip is functionally identical to Done in the state machine; drop one of them." Resolution: kept; semantically distinct (skip ≠ done). Critical input for T3+ pain-memory rule (skipped neck ≠ completed neck → biased recommendation later). G2 agency.

- FR-018: After the last exercise (or after skipping all), user sees a "Resume work?" prompt and can confirm to start a new work session or dismiss to stay idle. Priority: must-have
  > Socrates: Counter-argument considered: "Auto-resume the work session — prompts add friction and contradict pomodoro flow." Resolution: kept; symmetry with FR-008 (manual end). User after break may need tea / water / bathroom — auto-resume = forced cycle, abandonable. Pomodoro contract is boundary discipline, not auto-loop.

- FR-019: User who completes consecutive breaks does not see the same exercise twice in a row (no-repeat across adjacent breaks within the same browser session). Priority: must-have
  > Socrates: Counter-argument considered: "Small catalog (10–15) + narrow tag (eyes only) → no-repeat forces suboptimal pick over best one." Resolution: kept with caveat; FR-022 robustness guarantees ≥2 exercises per tag → 2-exercise tag rotates cleanly. Edge case (1-exercise tag) is prevented at catalog spec, not runtime.

### Catalog & Rule Engine

- FR-020: User receives 1–3 exercises drawn from a server-side seed catalog of 10–15 exercises, each tagged with body-area(s), duration in seconds, and instruction text. Priority: must-have
  > Socrates: Counter-argument considered: "10–15 is too few — 5+ body-areas × 2–3 intensities = 15+ minimum." Resolution: kept (10–15 floor) per A5 scope-down; 4 quick-pick paths × ≥2 exercises each = 8–12 minimum coverage. Extending to 20–25 is a T2+ quick win.

- FR-021: User receives an exercise selection whose tags match the body-area tags derived from their input (quick-pick selection or keyword-matched free-text). Priority: must-have
  > Socrates: Counter-argument considered: "Pure body-area match ignores intensity; a chronic-pain user shouldn't get a high-intensity exercise for the painful area." Resolution: kept for T1; single-dimension (body-area) only. Intensity dimension is T2+ when LLM extracts intensity context (see OQ4).

- FR-022: User receives a non-empty exercise sequence regardless of which input combination they submit — the catalog covers every quick-pick option and every recognized keyword tag. Priority: must-have
  > Socrates: Counter-argument considered: "'Every combination' is massive scope; 80% coverage with explicit empty-state for the 20% is more honest." Resolution: kept, bounded; 4 quick-pick × ≥2 exercises = 8 guaranteed; T1 keyword list is deliberately small (5–7 PL/EN body-area words). Coverage is finite and achievable with a 12-exercise catalog.

## User Stories

### US-01: First-time user completes a pomodoro cycle with pain-aware break

- **Given** a registered user signed in to PomoStretch on a fresh laptop session
- **When** they tap "Start work session" on the dashboard, then after the 25-minute work countdown completes (or they manually end early via "Zaczynaj przerwę"), they tap the "Tylko kark" quick-pick button on the break-input screen
- **Then** they see a sequence of 1–3 exercises tagged with the "neck" body-area, drawn from the seed catalog, each with a name, short description, and per-exercise countdown — and after marking the last one Done (or Skip), they see a "Resume work?" prompt that, when confirmed, starts a new 25-minute work session

#### Acceptance Criteria

- The exercise sequence loads in < 1.5s p95 from quick-pick tap to first exercise visible (Guardrail G1)
- The user can Skip any individual exercise without breaking the sequence flow (Guardrail G2)
- A page refresh during any phase (work session, break input, exercise sequence) restores state from `localStorage` within ~30s (Guardrail G3)
- No exercise from the immediately preceding break appears in this break (FR-019 — no-repeat)
- The "Tylko kark" path produces ≥1 exercise even if the catalog has only 2 neck-tagged items (FR-022 — robustness)

## Business Logic

When the user starts a break, the app selects 1–3 exercises from a tagged catalog by matching the user's submitted body-area input (quick-pick selection or tags derived from free-text) against exercise tags, applying no-repeat across adjacent breaks; in T2+, the selection is additionally biased toward body-areas the user reported in recent prior breaks.

**Inputs.** The rule consumes the user's break input — either a quick-pick selection (one of "Tylko oczy", "Tylko kark", "Ogólne", "Zaskocz mnie") or a free-text description of what hurts ("kark od myszki, łokieć po wczoraj"). It also consumes the body-area tags of the exercise the user did in the immediately preceding break (input for the no-repeat filter). In T2+, it additionally consumes a record of body-areas the user reported across recent prior breaks (the pain-memory bias signal).

**Output.** An ordered list of 1–3 exercises, each with a name, a short description, and a per-exercise duration (30s–2min). The list length depends on tag-match availability in the catalog and on the available break time budget; within the T1 5-minute budget, 1–3 exercises with 30s–2min durations fit comfortably.

**How the user encounters it.** The user submits break input (one quick-pick tap or one short free-text submission), and the exercise list appears within < 1.5s on the next screen. The user works through the list one exercise at a time, marking each Done or Skip until the list ends, after which they see a "Resume work?" prompt.

## Non-Functional Requirements

- **NFR-1 — Break content delivery.** The user perceives < 1.5s p95 latency from break-input submission to first exercise visible. (T1 must)
- **NFR-2 — Pomodoro state durability.** A user who refreshes the page or closes and reopens the browser tab within ~30 seconds during an active work session resumes the timer at the same elapsed second they left. (T1 must)
- **NFR-3 — Password storage opacity.** A user's password is not recoverable from any storage, log, or operational interface; only a salted hash from an OWASP-current algorithm exists. (T1 must)
- **NFR-4 — Auth resilience.** A legitimate user who mistypes their password three times in a row is not permanently locked out; automated credential-stuffing at scale is rejected before reaching the auth check. (T1 must)
- **NFR-5 — Browser support.** The product remains usable on the latest two major versions of the four mainstream desktop browsers (Chrome, Firefox, Safari, Edge). (T1 must)
- **NFR-6 — Free-text confidentiality.** User-submitted free-text describing pain leaves no operator-accessible trace beyond the lifetime of the request that produced an exercise selection. (T2+ when pain-extraction service lands)
- **NFR-7 — Pain-extraction endpoint scope.** The pain-extraction endpoint accepts and returns only structured pain-area data; it refuses requests that do not map to body-area / pain context. (T2+)
- **NFR-8 — Pain-extraction endpoint abuse resistance.** The pain-extraction endpoint rejects requests beyond a per-user hourly call limit and beyond a per-request input length / token cap. (T2+)
- **NFR-9 — Graceful degradation of pain extraction.** If the pain-extraction service is unreachable or rate-limited, the user still receives an exercise sequence via the keyword fallback parser; no error is surfaced to the user. (T2+)

## Non-Goals

**Functional non-goals (capabilities the MVP will not provide):**

1. **Voice / microphone input.** Free-text + quick-buttons cover input space; voice adds permission UX, audio processing, and platform fragmentation. Re-evaluate T4+ if user research shows demand.
2. **Service-worker push notifications when the tab is closed.** Notifications add browser-permission UX and serverless infra. Pomodoro discipline assumes the tab is open; closed-tab reminders are a different product.
3. **Generated images or GIFs of exercises.** Emoji + concise text instruction is sufficient for desk-sized movements. Image generation adds LLM cost, content moderation, and storage; cost > value at MVP scale.
4. **Streaks, gamification, or weekly statistics dashboards.** Empty-CRUD anti-pattern risk — these features motivate vanity metrics, not the core domain decision (recommend exercises). Re-evaluate T4+ only if engagement data demands it.
5. **Native mobile apps (iOS / Android).** Web-app on desktop browsers covers the persona's context (sitting at a desk during work). Mobile native multiplies maintenance and changes the input modality assumption.
6. **Social / sharing features (public exercise lists, "what hurt me today" feeds).** Single-tenant lock; sharing requires moderation, privacy review, and a content layer that is wholly out of scope for a desk-pain solo tool.
7. **Admin role and role-based capability matrix.** Single-user / flat-role MVP; admin operations (catalog edits) handled by direct DB access in T1. Re-evaluate T3+ when scaling beyond solo.
8. **Email verification, password-reset flow, magic-link login.** All require transactional email infrastructure (DKIM/SPF/SMTP), not blocking single-user MVP. T2+ when SMTP provider is added.
9. **Google / OAuth providers.** Email + password covers MVP. T2+ as a smoother onboarding path when there are real users to onboard.
10. **Multi-device user-state sync (break history, pain-memory across laptops).** Solo single-laptop workflow assumed; localStorage primary. T3+ if multi-device need surfaces.
11. **Configurable pomodoro durations (custom work / break length).** Hardcoded 25/5 in T1 (per Phase 3 A4 scope-down). Re-evaluate T3+ — config UI is a 1-day add but every config option multiplies edge cases (15-min work? 90-min ultradian? minute-level granularity?).

**Non-functional non-goals (quality dimensions the MVP will not aim for):**

12. **Full WCAG-AA compliance.** Basic keyboard navigation and contrast in T1; formal AA conformance audit is a T3+ effort with separate testing pass.
13. **GDPR cookie banner / consent flow.** No third-party tracking, no analytics SDK, no marketing tags in T1. Single auth cookie + functional localStorage are technically consent-required under strict EU interpretation but practically excepted under "strictly necessary" — re-evaluate if analytics enter T3+.
14. **Real-time multi-user sync, multi-region SLA, sub-100ms latency floor.** All cost-multipliers irrelevant at single-user scale. Re-evaluate only if usage profile changes.
15. **Internationalization (full i18n with locale switching).** T1 ships with PL + EN keywords mixed in catalog text and UI. Full per-locale translation infra (resource bundles, locale router, RTL support) is T3+ if user base widens beyond Polish-speaking devs.

## Quality cross-check (Phase 7)

| Element | Status |
|---|---|
| Access Control | **present** (`## Access Control` — email + password, flat single role, gated routes) |
| Business Logic (one-sentence rule) | **present** (`## Business Logic` — declarative rule, not "TBD") |
| Project artifacts | **present** (this `shape-notes.md` with valid frontmatter checkpoint) |
| Timeline-cost ack | `mvp_weeks=3` ≤ 3 default — within tight-timeline budget; no separate acknowledgment block needed |
| Non-Goals | **present** (15 items: 11 functional + 4 non-functional) |
| Preserved behavior | **n/a** (greenfield) |

**Result:** all 5 applicable elements present, brownfield-only check skipped. `quality_check_status: accepted` — no gaps to surface to `/10x-prd`'s Open Questions.

## Data Architecture (informational)

Persistence boundaries decided in Phase 3:

| Data | Storage | Rationale |
|---|---|---|
| Auth (email, password_hash) | Server-side DB | Hash never on client; login from any device |
| Exercise catalog (seed of 10–15) | Server-side DB | Seeded once at deploy; client requests subset per break |
| Pomodoro work-timer state | `localStorage` | G3 durability — survives refresh; per-device by design |
| Break history (exercise IDs, timestamps, user input) | `localStorage` | Solo single-laptop workflow; pain-memory rule (T2) reads here |
| Pain-memory bias data (T2+) | `localStorage` (computed) | Aggregation of recent break history; no separate store needed |
| Server-side user-state backup / multi-device sync | **Deferred to T3+** | Not blocking single-user MVP; revisit only if multi-device sync becomes a real use case |

This split keeps the T1 backend at ~3 endpoints (sign-up, sign-in, GET catalog), which is consistent with `mvp-ideas.md`'s "thin backend" intent. The pain-extraction endpoint (T2+) makes the backend ~4–5.

## Forward: tech-stack (RESOLVED — see `tech-stack.md`)

> **Status: resolved on 2026-06-04 via `/10x-tech-stack-selector`.** Selection locked at `context/foundation/tech-stack.md` (`starter_id: 10x-astro-starter`, deploy: `cloudflare-pages`, CI: `github-actions` auto-deploy-on-merge). The author-volunteered candidates below are kept for historical context only — they reflect the initial preference space, not the locked decision.

**Locked stack (from `tech-stack.md`):**
- **Starter:** `10x-astro-starter` — Astro 6 + React 19 islands + TypeScript + Tailwind 4 + Supabase (Postgres + Auth + storage) + Cloudflare Pages/Workers/KV. Single full-stack repo.
- **Deployment:** `cloudflare-pages` (edge runtime, free tier, gives `*.pages.dev` subdomain by default; custom domain optional).
- **CI/CD:** GitHub Actions auto-deploy-on-merge to `main`. PR previews on Cloudflare per-PR free.
- **Auth:** Supabase Auth (email + password, email verification + password reset available out-of-box for T2+).
- **DB:** Supabase Postgres (catalog server-side, user-state in `localStorage` per Phase 3 architecture).
- **Pain-extraction service candidate (T2+):** OpenAI via fetch from a Cloudflare Worker (Astro API route). System prompt server-side; LLM security backlog applies on landing.

**Originally considered (now superseded):**

- **Backend candidate:** ASP.NET Core 9 Minimal API + EF Core; SQLite (dev) / Postgres (prod) — *dropped: would have required a second repo + separate frontend bootstrapping + manual auth wiring; +8–12h zero-to-one overhead vs the locked full-stack starter, against a 15–20h T1 budget.*
- **Frontend candidate:** React + Vite + TypeScript + TailwindCSS + shadcn/ui — *folded into Astro: React + TS + Tailwind survive verbatim as React islands inside Astro pages; only the Vite-as-build-tool layer was replaced by Astro's build pipeline.*
- **Auth implementation candidates:** ASP.NET Core Identity, Clerk, Auth0 — *dropped: Supabase Auth in the starter covers the same surface (email + password, OAuth-ready, hash management) without separate setup.*
- **Hosting candidates:** Azure App Service, Vercel, Netlify, Supabase free tier — *Supabase kept for DB + Auth, Vercel listed as alternative deployment target in the starter card; Cloudflare Pages preferred for edge-runtime latency profile and free tier.*
- **T2+ candidates:** Resend / SendGrid (transactional email), Google OAuth via OIDC — *unchanged: still T2+, now arrive via Supabase Auth providers (Google OAuth is a one-config-line add) and a Cloudflare-Workers-compatible email provider when transactional email lands.*

## Forward: pain-extraction security backlog (informational — applied when endpoint lands in T2+)

User-raised concern about LLM endpoint hardening. Captured here so it doesn't get lost when the endpoint is implemented in T2. Translates into NFR-6, NFR-7, NFR-8, NFR-9 above.

- System prompt is server-side only; never exposed to the client.
- Endpoint accepts a structured request (free_text, duration_budget) and returns structured JSON only — no general chat-completion affordance.
- Free-text input length cap at server boundary (suggested ≤ 200 characters).
- Per-user rate limit on the extraction endpoint (suggested ≤ 30 calls / hour — well above realistic usage, blocks abuse).
- Token budget cap per request (suggested ≤ 200 input + ≤ 50 output tokens).
- System prompt explicitly refuses any request that does not map to body-area / pain extraction.
- Free-text is not persisted server-side beyond the lifetime of the request that consumed it (no log retention of raw user text).
- Failed prompt-injection attempts are flagged in logs for review.

## Open Questions (running)

1. **Catalog management workflow post-deploy.** T1 decision: direct DB UPDATE (acceptable for solo). T3+ decision pending: whether to add a minimal admin panel gated by `ADMIN_EMAIL` env var when scaling beyond solo.
2. **Bot / spam protection without email verification.** T1 decision: not blocking single-user MVP. T3+ task (when going public): add rate-limiting on `/signup` plus captcha.
3. **Hide-countdown toggle for anxiety-prone users.** Surfaced during Socrates round on FR-006. T3+ option — small UX feature, accessibility win, not blocking.
4. **Exercise intensity dimension in the catalog and selection rule.** Surfaced during Socrates round on FR-021. T2+ feature when LLM lands and can extract intensity context from free-text.
5. **Multi-device user-state sync trigger threshold.** Surfaced during Phase 6 framing Socrates probe. Pain-memory rule scaling at ~10+ users requiring cross-device parity → triggers T3+ server-side aggregation. Track usage profile.
