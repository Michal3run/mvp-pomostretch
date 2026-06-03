---
project: PomoStretch
version: 1
status: draft
created: 2026-06-02
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
---

# PomoStretch — Product Requirements Document

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
- **Pomodoro state durability** — active work-timer state survives page refresh and browser tab close-and-reopen within ~30 seconds. Accidental Ctrl+R during a 24th-minute work session does not lose the session.

## User Stories

### US-01: First-time user completes a pomodoro cycle with pain-aware break

- **Given** a registered user signed in to PomoStretch on a fresh laptop session
- **When** they tap "Start work session" on the dashboard, then after the 25-minute work countdown completes (or they manually end early via "Zaczynaj przerwę"), they tap the "Tylko kark" quick-pick button on the break-input screen
- **Then** they see a sequence of 1–3 exercises tagged with the "neck" body-area, drawn from the seed catalog, each with a name, short description, and per-exercise countdown — and after marking the last one Done (or Skip), they see a "Resume work?" prompt that, when confirmed, starts a new 25-minute work session

#### Acceptance Criteria

- The exercise sequence loads in < 1.5s p95 from quick-pick tap to first exercise visible (Guardrail G1)
- The user can Skip any individual exercise without breaking the sequence flow (Guardrail G2)
- A page refresh during any phase (work session, break input, exercise sequence) restores the state the user had within ~30s (Guardrail G3)
- No exercise from the immediately preceding break appears in this break (FR-019 — no-repeat)
- The "Tylko kark" path produces ≥1 exercise even if the catalog has only 2 neck-tagged items (FR-022 — robustness)

## Functional Requirements

### Authentication

- FR-001: User can register with email + password from a sign-up form. Priority: must-have
  > Socratic: Counter-argument considered: "Single-user MVP doesn't need registration; a hardcoded admin user is enough." Resolution: kept; access control is an explicit baseline requirement, hardcoded would force config-edit per laptop and reads as anonymous demo to evaluators.

- FR-002: User can sign in with email + password from a sign-in form. Priority: must-have
  > Socratic: Counter-argument considered: "Persistent session means the user signs in once and never again; second-time sign-in is dead capability." Resolution: kept; session lifetimes are bounded (typical 7–30 days) and FR-003 sign-out triggers re-authentication.

- FR-003: User can sign out, ending the active authenticated session. Priority: must-have
  > Socratic: Counter-argument considered: "Solo app on personal laptop — sign-out is dead UX." Resolution: kept; multi-device safety (borrowed laptop, public browser, demo on someone else's machine), evaluators expect this affordance.

- FR-004: An unauthenticated request to any gated route redirects to the sign-in screen. Priority: must-have
  > Socratic: Counter-argument considered: "An error response is enough; redirect adds routing logic." Resolution: kept; redirect is product-level UX, error response is operator-level. Standard SPA tooling provides redirect at zero cost.

### Pomodoro Timer

- FR-005: User can start a 25-minute work session from the dashboard. Priority: must-have
  > Socratic: Counter-argument considered: "Hardcoded 25 minutes ignores users with different work cadences (ADHD, deep flow, varied tasks)." Resolution: kept for MVP; configurability deferred and surfaced in `## Non-Goals`.

- FR-006: User sees a live countdown of the remaining work-session time. Priority: must-have
  > Socratic: Counter-argument considered: "Live countdown generates anxiety / clock-watching, lowering productivity." Resolution: kept; visible progress is core to pomodoro psychology — without it, no sense of session arc. Hide-toggle is a future option (see Open Questions).

- FR-007: User can extend the active work session by +5 minutes. Priority: must-have
  > Socratic: Counter-argument considered: "+5 min undermines pomodoro discipline; every extension is procrastination." Resolution: kept; serves as data input for a future adaptive-break business rule (3× +5min → suggest longer break) — without FR-007, that future feature has no signal.

- FR-008: User can manually end the work session early and proceed to the break-input screen ("Zaczynaj przerwę"). Priority: must-have
  > Socratic: Counter-argument considered: "Manual break-start is anti-pattern; pomodoro discipline says timer rules, not user mood." Resolution: kept; real-world interrupts (meetings, lunch, urgent ping) > 0%. Forced timer in those moments produces an abandoned app.

- FR-009: When the work-session countdown reaches zero, the app automatically transitions to the break-input screen. Priority: must-have
  > Socratic: Counter-argument considered: "Auto-transition disrupts user mid-thought; should require 'Continue?' confirmation." Resolution: kept; auto-transition is the pomodoro contract — gentle forced break is the value. User mid-thought has FR-007 (+5min). Manual confirmation defeats the boundary discipline.

### Break-Input Flow

- FR-010: User can submit one of 4 quick-pick selections (Tylko oczy / Tylko kark / Ogólne / Zaskocz mnie) on the break-input screen to proceed to the exercise sequence. Priority: must-have
  > Socratic: Counter-argument considered: "4 buttons is arbitrary middle — either 1 (Zaskocz mnie alone) or 8+ (full body-area enumeration)." Resolution: kept; 4 covers Pareto desk-pain categories from ergonomic research plus an escape (Zaskocz mnie). 1 removes personalization; 8+ re-introduces decision paralysis.

- FR-011: User can submit free-text describing what hurts; in the MVP the input is processed by case-insensitive keyword substring matching against a curated Polish + English keyword list to derive body-area tags. Priority: must-have
  > Socratic: Counter-argument considered: "MVP has no inference layer — free-text with keyword match is theatre; drop the input field, leave only buttons." Resolution: kept; field is the upgrade hook for a later extraction-service swap-in. Removing it now adds UI rework + user confusion later.

- FR-012: User who submits free-text that does not match any known keyword still receives an exercise sequence — system falls back to a "general" tag selection rather than returning empty / error. Priority: must-have
  > Socratic: Counter-argument considered: "Should show explicit 'didn't understand' error to teach the user the keyword vocabulary." Resolution: kept; error path penalizes users with imperfect spelling / slang — graceful degradation is preferable.

- FR-013: User can skip the entire break and proceed directly to a new work session ("Skip break"). Priority: must-have
  > Socratic: Counter-argument considered: "Skip-break wipes the health value of pain-aware product; should impose limit (max 2 skips/day) or justification dialog." Resolution: kept; limit/dialog is paternalistic UX, breaks user agency. Skip-tracking can become a passive analytics nudge later, not MVP enforcement.

### Exercise Sequence

- FR-014: User receives a sequence of 1–3 exercises selected by the rule engine after submitting break input. Priority: must-have
  > Socratic: Counter-argument considered: "Variable count creates inconsistent UX; fix at always 3." Resolution: kept; variable adapts to break time budget, available tag matches, and future adaptive-break behavior. Fixed 3 forces filler exercises when quality matches < 3.

- FR-015: User sees each exercise displayed with name, short description, and a per-exercise countdown timer. Priority: must-have
  > Socratic: Counter-argument considered: "Per-exercise countdown is granular noise; a single 5-min break-timer is enough." Resolution: kept; bounded micro-targets (30s, 1m, 30s) drive higher compliance than amorphous 5-min blocks per behavioral-design research.

- FR-016: User can mark the current exercise as Done to advance to the next exercise (or end the sequence if it's the last). Priority: must-have
  > Socratic: Counter-argument considered: "Auto-advance when countdown hits zero is enough; Done button is redundant tap." Resolution: kept; Done = "completed it" semantic distinct from Skip. Future analytics distinguishes compliance %. User may finish faster than countdown (5 reps in 20s) and tap Done.

- FR-017: User can Skip the current exercise to advance to the next exercise (or end the sequence if it's the last). Priority: must-have
  > Socratic: Counter-argument considered: "Skip is functionally identical to Done in the state machine; drop one of them." Resolution: kept; semantically distinct (skip ≠ done). Critical input for a future pain-memory rule (skipped neck ≠ completed neck → biased recommendation later).

- FR-018: After the last exercise (or after skipping all), user sees a "Resume work?" prompt and can confirm to start a new work session or dismiss to stay idle. Priority: must-have
  > Socratic: Counter-argument considered: "Auto-resume the work session — prompts add friction and contradict pomodoro flow." Resolution: kept; symmetry with FR-008 (manual end). User after break may need tea / water / bathroom — auto-resume = forced cycle, abandonable.

- FR-019: User who completes consecutive breaks does not see the same exercise twice in a row (no-repeat across adjacent breaks within the same browser session). Priority: must-have
  > Socratic: Counter-argument considered: "Small catalog (10–15) + narrow tag (eyes only) → no-repeat forces suboptimal pick over best one." Resolution: kept with caveat; FR-022 robustness guarantees ≥2 exercises per tag → 2-exercise tag rotates cleanly. Edge case (1-exercise tag) is prevented at catalog spec, not runtime.

### Catalog & Rule Engine

- FR-020: User receives 1–3 exercises drawn from a curated seed catalog of 10–15 exercises, each tagged with body-area(s), duration in seconds, and instruction text. Priority: must-have
  > Socratic: Counter-argument considered: "10–15 is too few — 5+ body-areas × 2–3 intensities = 15+ minimum." Resolution: kept (10–15 floor) per MVP scope-down; 4 quick-pick paths × ≥2 exercises each = 8–12 minimum coverage. Extending to 20–25 is a quick win post-MVP.

- FR-021: User receives an exercise selection whose tags match the body-area tags derived from their input (quick-pick selection or keyword-matched free-text). Priority: must-have
  > Socratic: Counter-argument considered: "Pure body-area match ignores intensity; a chronic-pain user shouldn't get a high-intensity exercise for the painful area." Resolution: kept for MVP; single-dimension (body-area) only. Intensity dimension is post-MVP when richer input extraction is added (see Open Questions).

- FR-022: User receives a non-empty exercise sequence regardless of which input combination they submit — the catalog covers every quick-pick option and every recognized keyword tag. Priority: must-have
  > Socratic: Counter-argument considered: "'Every combination' is massive scope; 80% coverage with explicit empty-state for the 20% is more honest." Resolution: kept, bounded; 4 quick-pick × ≥2 exercises = 8 guaranteed; the recognized keyword list is deliberately small (5–7 PL/EN body-area words). Coverage is finite and achievable with a 12-exercise catalog.

## Non-Functional Requirements

- **NFR-1 — Break content delivery.** The user perceives < 1.5s p95 latency from break-input submission to first exercise visible. (MVP must)
- **NFR-2 — Pomodoro state durability.** A user who refreshes the page or closes and reopens the browser tab within ~30 seconds during an active work session resumes the timer at the same elapsed second they left. (MVP must)
- **NFR-3 — Password storage opacity.** A user's password cannot be retrieved from any storage, log, or operational interface; only a salted hash from a current industry-standard password-hashing algorithm exists. (MVP must)
- **NFR-4 — Auth resilience.** A legitimate user who mistypes their password three times in a row is not permanently locked out; automated credential-stuffing at scale is rejected before reaching the auth check. (MVP must)
- **NFR-5 — Browser support.** The product remains usable on the latest two major versions of the four mainstream desktop browsers (Chrome, Firefox, Safari, Edge). (MVP must)
- **NFR-6 — Free-text confidentiality.** User-submitted free-text describing pain leaves no operator-accessible trace beyond the lifetime of the request that produced an exercise selection. (Post-MVP, when free-text inference is added)
- **NFR-7 — Pain-area extraction scope.** The pain-area extraction interaction accepts and returns only structured pain-area data; requests that do not map to body-area or pain context are refused. (Post-MVP)
- **NFR-8 — Pain-area extraction abuse resistance.** Pain-area extraction is bounded by a per-user hourly request limit and per-request input-length and computational-budget caps. (Post-MVP)
- **NFR-9 — Graceful degradation of pain-area extraction.** When pain-area inference is unavailable for any reason, the user still receives an exercise sequence using the deterministic input mapping; no error or empty state is surfaced to the user. (Post-MVP)

## Business Logic

When the user starts a break, the app selects 1–3 exercises from a tagged catalog by matching the user's submitted body-area input (quick-pick selection or tags derived from free-text) against exercise tags, applying no-repeat across adjacent breaks; in a later iteration, the selection is additionally biased toward body-areas the user reported in recent prior breaks.

**Inputs.** The rule consumes the user's break input — either a quick-pick selection (one of "Tylko oczy", "Tylko kark", "Ogólne", "Zaskocz mnie") or a free-text description of what hurts ("kark od myszki, łokieć po wczoraj"). It also consumes the body-area tags of the exercise the user did in the immediately preceding break (input for the no-repeat filter). In a later iteration, it additionally consumes a record of body-areas the user reported across recent prior breaks (the pain-memory bias signal).

**Output.** An ordered list of 1–3 exercises, each with a name, a short description, and a per-exercise duration (30s–2min). The list length depends on tag-match availability in the catalog and on the available break time budget; within the MVP 5-minute budget, 1–3 exercises with 30s–2min durations fit comfortably.

**How the user encounters it.** The user submits break input (one quick-pick tap or one short free-text submission), and the exercise list appears within < 1.5s on the next screen. The user works through the list one exercise at a time, marking each Done or Skip until the list ends, after which they see a "Resume work?" prompt.

## Access Control

Single role (flat); every authenticated user has identical capabilities. No admin tier in the MVP.

**Sign-up:** email + password. The user's password is never stored or logged as plaintext — only a salted hash from a current industry-standard password-hashing algorithm exists. No email verification step in the MVP; accounts are usable immediately.

**Sign-in:** email + password verified against the stored hash. A successful sign-in establishes an authenticated session that the user can resume from multiple devices (auth state is shared across devices; user-state — timer, break history, pain-memory — is per-device, by design).

**Unauthenticated access:** every product feature (timer, break screen, exercise sequence) is gated. An unauthenticated request to any gated route redirects to sign-in.

**Out of MVP scope (deferred):** email verification, password reset flow, magic-link login, third-party / OAuth identity providers, admin role, role-based capability matrix, multi-device user-state sync. See `## Non-Goals`.

## Non-Goals

**Functional non-goals (capabilities the MVP will not provide):**

1. **Voice / microphone input.** Free-text + quick-buttons cover input space; voice adds permission UX, audio processing, and platform fragmentation. Re-evaluate post-MVP if user research shows demand.
2. **Out-of-tab notifications when the browser tab is closed.** Notifications add browser-permission UX and additional infrastructure. Pomodoro discipline assumes the tab is open; closed-tab reminders are a different product.
3. **Generated images or GIFs of exercises.** Emoji + concise text instruction is sufficient for desk-sized movements. Image generation adds inference cost, content moderation, and storage; cost > value at MVP scale.
4. **Streaks, gamification, or weekly statistics dashboards.** Empty-CRUD anti-pattern risk — these features motivate vanity metrics, not the core domain decision (recommend exercises). Re-evaluate post-MVP only if engagement data demands it.
5. **Native mobile apps (iOS / Android).** Web product on desktop browsers covers the persona's context (sitting at a desk during work). Native multiplies maintenance and changes the input modality assumption.
6. **Social / sharing features (public exercise lists, "what hurt me today" feeds).** Single-tenant lock; sharing requires moderation, privacy review, and a content layer that is wholly out of scope for a desk-pain solo tool.
7. **Admin role and role-based capability matrix.** Single-user / flat-role MVP; admin operations (catalog edits) handled by direct catalog edits in the MVP. Re-evaluate when scaling beyond solo.
8. **Email verification, password-reset flow, magic-link login.** All require deliverable email infrastructure, not blocking single-user MVP. Post-MVP when an email provider is added.
9. **Third-party / OAuth identity providers.** Email + password covers MVP. Post-MVP as a smoother onboarding path when there are real users to onboard.
10. **Multi-device user-state sync (break history, pain-memory across laptops).** Solo single-laptop workflow assumed; per-device user-state by design. Revisit if multi-device need surfaces.
11. **Configurable pomodoro durations (custom work / break length).** Hardcoded 25/5 in MVP. Re-evaluate post-MVP — every config option multiplies edge cases (15-min work? 90-min ultradian? minute-level granularity?).

**Non-functional non-goals (quality dimensions the MVP will not aim for):**

12. **Full WCAG-AA compliance.** Basic keyboard navigation and contrast in MVP; formal AA conformance audit is a post-MVP effort with separate testing pass.
13. **GDPR cookie banner / consent flow.** No third-party tracking, no analytics, no marketing tags in MVP. Authentication state and per-device functional preferences are technically consent-required under strict EU interpretation but practically excepted under "strictly necessary" — re-evaluate if analytics enter post-MVP.
14. **Real-time multi-user sync, multi-region SLA, sub-100ms latency floor.** All cost-multipliers irrelevant at single-user scale. Re-evaluate only if usage profile changes.
15. **Internationalization (full i18n with locale switching).** MVP ships with PL + EN keywords mixed in catalog text and UI. Full per-locale translation infrastructure is post-MVP if user base widens beyond Polish-speaking devs.

## Open Questions

1. **Catalog management workflow post-deploy.** MVP decision: direct catalog edits (acceptable for solo). Post-MVP decision pending: whether to add a minimal admin interface gated by a single-admin marker when scaling beyond solo. Owner: user.
2. **Bot / spam protection without email verification.** MVP decision: not blocking single-user MVP. Post-MVP task (when going public): add bot-resistance measures (rate-limiting plus captcha) on the registration entry point. Owner: user.
3. **Hide-countdown toggle for anxiety-prone users.** Surfaced during the Socratic round on FR-006. Post-MVP option — small UX feature, accessibility win, not blocking. Owner: user.
4. **Exercise intensity dimension in the catalog and selection rule.** Surfaced during the Socratic round on FR-021. Post-MVP feature when richer free-text extraction is added and can derive intensity context ("delikatnie boli" vs "diabolicznie boli"). Owner: user.
5. **Multi-device user-state sync trigger threshold.** Surfaced during product framing. Pain-memory rule scaling at ~10+ users requiring cross-device parity → triggers post-MVP server-side aggregation. Track usage profile. Owner: user.
