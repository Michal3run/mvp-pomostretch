---
project: PomoStretch
version: 1
status: draft
created: 2026-07-10
context_type: lessons-learned
related_docs:
  - context/foundation/roadmap.md
  - context/foundation/prd.md
  - context/foundation/test-plan.md
---

# Lessons Learned — PomoStretch

Recurring rules, pitfalls, and hard-won patterns discovered during roadmap planning and implementation. Append-only register — new lessons added at the bottom with date, older entries never deleted.

## Purpose

This file captures **project-specific** gotchas that:
- Appeared in at least one milestone's risk register
- Are not obvious from reading the PRD or tech stack docs
- Will bite future contributors (or you in 3 months) if not documented

**Anti-patterns** (what this file is NOT):
- Generic best practices ("write tests" — we have test-plan.md for that)
- Framework documentation ("how Astro middleware works" — that's in Astro docs)
- One-off bugs with no recurrence risk ("typo in line 42" — that's a commit message)

**Anticipated vs Learned Lessons**:
- **L1–L9** (dated 2026-07-10) are **anticipatory lessons** — surfaced during roadmap planning, before any implementation code was written. These are patterns we expect to hit based on risk analysis, not lessons learned from actual failures.
- **Future lessons** (L10+) will be **implementation-learned** — appended as milestones complete and real issues emerge. These come from "we thought X would work, but Y happened instead."

The distinction matters: anticipatory lessons are educated guesses (worth documenting, but unvalidated); learned lessons are battle-tested truth. As implementation progresses, L1–L9 may be confirmed, refined, or contradicted by later entries.

## Lessons

### L1: Horizontal Milestones Must Name Their Downstream Verticals
**Date**: 2026-07-10  
**Context**: Roadmap planning, M1 (Database Schema & Exercise Catalog)

**Problem**: M1 is a horizontal enabler (schema + seed data, no user-visible feature). The 10xDevs course preaches vertical slices, so justifying M1 requires explicit reasoning.

**Solution**: M1 is **bounded** (exactly 2 tables, no API endpoints) and **names its downstream verticals** (M4 Exercise Selection needs `exercise` table, M5 Break History needs `break_session` table). It's the **smallest horizontal** that unblocks two verticals without forcing duplication.

**Guideline**: If you ever propose a horizontal milestone, answer:
1. What are the downstream vertical milestones it unblocks? (Name them by ID/name.)
2. Why can't the horizontal work be absorbed into one of those verticals? (e.g., "M4 would need to replicate catalog logic for M5 to use")
3. Is this the **smallest** horizontal that unblocks the named verticals? (e.g., "Could we ship just `exercise` table first, defer `break_session`?")

If you can't answer all three, default to vertical.

---

### L2: Exercise Catalog Seed is Creative Work, Not Code Generation
**Date**: 2026-07-10  
**Context**: Roadmap unknowns, M1 effort estimation

**Problem**: M1 requires 12-15 exercise descriptions (50-200 chars each, original, safe, clear). Initial estimate treated this as "INSERT statements" (15 min). Actual effort: 1.5-2h.

**Why**: Writing exercise descriptions requires:
- Ergonomic research (desk-pain categories, safe ranges of motion)
- Quality bar enforcement (clear, actionable, not copy-pasted from web to avoid IP issues)
- Coverage validation (ensure ≥2 exercises per body-area tag)

This is **human creative work**, not boilerplate.

**Guideline**: When estimating tasks that involve "writing N seed rows", check if the rows require domain expertise, safety review, or originality constraints. If yes, allocate ≥30 min per 5 rows, not ≥5 min per 50 rows.

---

### L3: RLS Policies are Easy to Misconfigure, Hard to Audit Post-Deploy
**Date**: 2026-07-10  
**Context**: M1 `break_session` schema, M5 CRUD authorization, test-plan R-02/R-05

**Problem**: Supabase RLS policies default to "deny all" when enabled. A missing `SELECT` policy for `authenticated` role = empty results, not an error. A missing `using (user_id = auth.uid())` check = cross-user data leak.

**Why it's hard**: RLS is declarative SQL, not imperative code. You can't "step through" a policy. Local `supabase start` + `psql` gives you superuser access by default, bypassing RLS — so "works on my machine" is a false signal.

**Mitigation checklist** (enforced in M1 + M5):
1. Write RLS policies **before** writing any API endpoint that touches the table
2. Test with **two users** (A creates row, B attempts to read) via Supabase client (not `psql` superuser)
3. Validate all four verbs: `SELECT`, `INSERT`, `UPDATE`, `DELETE` — each needs its own policy
4. Document the test in milestone acceptance criteria (not just "RLS enabled" — "RLS tested with user A/B")

**Guideline**: For any table with `user_id` FK, add this to the milestone handoff checklist:
```sql
-- As user A
INSERT INTO <table> (...) VALUES (...) RETURNING id;
-- As user B (via Supabase client, not psql)
SELECT * FROM <table> WHERE id = <user_A_row_id>; -- expect 0 rows
```

If this query returns user A's row when executed by user B, RLS is broken.

---

### L4: localStorage Durability Has Browser-Specific Failure Modes
**Date**: 2026-07-10  
**Context**: M2 Pomodoro Timer, NFR-2 (timer state survives refresh), Guardrail G3

**Problem**: `localStorage` is the obvious choice for persisting timer state (no server round-trip, instant read). But it fails in:
- Private/incognito mode (quota = 0 or cleared on tab close)
- Safari with ITP enabled (aggressive clearing after 7 days of inactivity, sometimes sooner)
- User action ("Clear browsing data" wipes `localStorage`)
- Quota exceeded (rare but possible if other apps abuse storage)

**Why this matters**: NFR-2 says "timer survives page refresh within ~30s". If `localStorage` is unavailable, the timer **cannot** meet this requirement — falling back to in-memory state means refresh = lost timer.

**Mitigation** (implemented in M2):
1. Wrap `localStorage.setItem` / `getItem` in try-catch, fall back to in-memory state on exception
2. Show warning toast if `localStorage` unavailable: "Timer won't persist across refreshes"
3. Accept this as a known limitation (not a blocker) — document in README
4. Post-MVP: migrate to server-side session state if `localStorage` failure rate > 5%

**Guideline**: If a feature depends on `localStorage` for a core requirement (not just "nice to have"), add a fallback + warning. Never assume `localStorage` is available.

---

### L5: Keyword Matching is a Tuning Knob, Not a Binary Feature
**Date**: 2026-07-10  
**Context**: M3 Break Input, FR-011/FR-012, Risk R5

**Problem**: M3 uses case-insensitive substring match against a curated keyword list to derive body-area tags from free-text input. Initial reaction: "This is too naive, we need fuzzy match or LLM extraction now."

**Why deferring is correct**: 
- MVP keyword list is 5-7 words per body-area (PL + EN) = ~30 total keywords
- Substring match is **fast** (< 5ms), **deterministic** (no API call, no quota), and **testable** (unit test with 10 examples = full coverage)
- Graceful fallback to `general` tag prevents empty-state dead-ends (FR-012)

**What we're actually learning**: Which free-text inputs users type (not "what algorithm is best"). Only after 100+ real inputs can we decide if fuzzy match or LLM extraction adds value.

**Mitigation**:
- Start with substring match (MVP)
- Log unmatched free-text inputs (post-MVP, when analytics exist)
- Re-evaluate after 100+ logged inputs — if > 30% fall back to `general`, improve matcher

**Guideline**: When a feature has an "obvious upgrade path" (e.g., substring → fuzzy → LLM), resist the temptation to build the final version first. Ship the simplest version that prevents dead-ends, then tune based on real usage.

---

### L6: Test Coverage Should Map 1:1 to Risk Register, Not Framework Conventions
**Date**: 2026-07-10  
**Context**: M6 Testing & Certification, test-plan.md

**Problem**: Test frameworks (Playwright, Vitest) ship with example test suites that cover "happy path" + "obvious edge cases" (e.g., empty input, long input, special chars). It's tempting to copy those as a starting point.

**Why that's a trap**: PomoStretch's highest-risk failure modes are:
- R-02: User A sees user B's break sessions (RLS bug)
- R-03: Full US-01 cycle has a dead-end somewhere (integration gap)
- R-04: Rule engine returns 0 exercises for a quick-pick (catalog coverage gap)

None of these are "empty input" or "special chars" — they're **domain-specific invariants** that only exist because of the PRD's success criteria and guardrails.

**Correct approach** (enforced in M6):
1. Every test file header links to a risk ID from test-plan.md (`// Covers R-02, R-05`)
2. Test implementation order follows risk register priority (High impact + Medium likelihood first)
3. Tests that don't map to a numbered risk are **not written** (unless they uncover a new risk, which gets added to the register)

**Guideline**: Before writing a test, ask "Which risk from test-plan.md does this address?" If the answer is "none", either:
- Add a new risk to test-plan.md and assign it an ID
- Or don't write the test (it's coverage theatre)

---

### L7: Effort Estimates Should Separate Code Time from Creative Time
**Date**: 2026-07-10  
**Context**: Roadmap effort estimation, all milestones

**Problem**: M1 estimated at "3-4 hours", but 1.5-2h of that is writing exercise descriptions (creative work). If someone reads "3-4h" and assumes "all coding", they'll be 24 minutes into the task and realize they need another 90 minutes they didn't budget.

**Solution**: Milestone effort estimates should call out non-coding time:
- M1: "3-4h (includes 1.5-2h exercise description writing)"
- M4: "5-6h (includes 1h rule engine logic design)"
- M6: "6-8h (includes 2h manual guardrail validation)"

**Why this matters**: After-hours budget (12-15h/week) is constrained. If 30-40% of a milestone is "research and write", not "code", the developer needs to plan that as a separate session (not "I'll bang this out in one evening of coding").

**Guideline**: When estimating a milestone, break effort into:
- Pure coding (routes, components, DB queries)
- Creative/research work (seed data, schema design, test scenario design)
- Validation/manual testing (browser testing, cross-device checks)

Report total + breakdown. Example: "M5: 6-8h total (4h coding, 2h test design, 1-2h manual validation)".

---

### L8: Guardrails Need Measurement Plans, Not Just Acceptance Checkboxes
**Date**: 2026-07-10  
**Context**: M6 manual validation, Guardrails G1/G2/G3 from PRD

**Problem**: PRD defines three guardrails:
- G1: Break content loads in < 1.5s p95
- G2: User can skip at any point without dead-ends
- G3: Timer state survives page refresh

It's tempting to write acceptance criteria as checkboxes ("✅ G1 validated"). But **how** was it validated? One attempt? Ten? From which network conditions?

**Solution** (implemented in M6): Each guardrail has a **measurement protocol**:
- G1: Open DevTools Network tab, measure 3 attempts from same region as Supabase, pass if all ≤ 1500ms
- G2: Start sequence with 3 exercises, click Skip on each, confirm always advances
- G3: Start timer, wait until 12:00 remaining, hard refresh, confirm resume at 12:00 ± 2s

**Guideline**: When a PRD guardrail includes a quantitative threshold (< 1.5s, > 95%, ≤ 3 retries), write a measurement protocol in the milestone that validates it. Include:
- Number of attempts (1 is not enough)
- Pass criterion (exact threshold, tolerance)
- Failure handling (what to do if it fails — tune? accept? block?)

If you can't measure it, you can't claim it's validated.

---

## Update Protocol

Append new lessons to the bottom of `## Lessons` with:
- **Date**: when the lesson was learned (not when it was written)
- **Context**: which milestone, doc, or conversation surfaced it
- **Problem**: what went wrong, or what confusion arose
- **Solution** (if resolved) or **Mitigation** (if accepted as limitation)
- **Guideline**: the actionable rule for future work

Never delete or edit existing lessons — if a lesson becomes obsolete (e.g., tech stack changes), add a new lesson referencing the old one and explaining why it no longer applies.

---

**Lessons file created.** Eight lessons captured from roadmap planning. Future milestones will append to this file as new patterns emerge.



### L9: Agent Context Loss Between Sessions Requires Explicit Handoff Checklists
**Date**: 2026-07-10  
**Context**: 10xDevs course workflow, agent-assisted implementation across multiple sessions

**Problem**: In an agent-assisted workflow (using AI to implement milestones), each implementation session starts fresh — the agent has no memory of what the previous agent (or previous session) did. Without explicit handoff artifacts, a new agent will:
- Re-read the entire roadmap and re-plan work already done
- Miss intermediate decisions captured only in code or uncommitted notes
- Re-implement functionality that partially exists (duplication)
- Skip validation steps that were supposed to happen before this milestone

**Why this is different from human handoff**: A human developer returning to the project after a break remembers context (recent commits, mental models, "oh yeah, I was debugging X"). An agent has zero context beyond what's written in docs and committed code. If handoff state isn't explicit, the agent operates blind.

**Mitigation checklist** (enforced in roadmap):
1. **Start every implementation session by reading the milestone's handoff checklist** from the roadmap. Example: before starting M4, read M3's "Handoff to Next Milestone" section to know what M3 was supposed to deliver.
2. **Validate handoff acceptance criteria before starting work**. Don't assume the previous milestone is done — run the validation steps (e.g., "M3 complete: click 'Tylko kark', confirm cookie exists").
3. **If a change folder exists** (`context/changes/<change-id>/`), read its `plan.md` or `change.md` before generating a new plan. The existing doc may have captured decisions not in the roadmap.
4. **Write handoff state into commit messages or a `STATUS.md`** if a milestone is partially complete. Example: "M2: timer UI done, localStorage persistence not started." This prevents the next agent from thinking M2 is fully done.
5. **Never rely on "I remember from last time"** — agents don't remember. If it's not written in a file the agent can read, it doesn't exist.

**Where this lesson came from**: Anticipated during roadmap planning (all lessons L1-L8 created before implementation started). This specific lesson is drawn from 10xDevs course patterns where agent handoff friction is a known operational risk.

**Guideline**: Treat the roadmap's "Handoff to Next Milestone" sections as **mandatory reading** at the start of each implementation session, not optional. If you're an agent starting work, always ask: "What was the previous milestone supposed to deliver, and how do I verify it's done?"

---

### L10: Track Deployment State Explicitly to Prevent Roadmap Assumptions
**Date**: 2026-07-11  
**Context**: Roadmap generation, deployment status confusion

**Problem**: The initial roadmap (v1, created 2026-07-10) stated in multiple places that "production deployment not executed" and listed deployment as future M6 work. In reality, the deployment was **completed 2026-06-09** per `context/changes/deployment/deployment-plan.md` (M1L5) — production live at https://pomo-stretch.michal3run.workers.dev, Supabase project operational, secrets configured, auto-deploy active.

**Why this happened**: The roadmap generation skill read:
- `deployment-plan.md` frontmatter: `"Mode: Plan only. Nothing here has been executed."` (line 1)
- But **not** the execution status at the bottom: `"Execution status: Complete. All phases executed 2026-06-09."` (line 226)

The skill assumed "plan exists = not executed" and propagated that assumption through 5+ sections of the roadmap.

**Why this matters**: A roadmap that treats deployed infrastructure as "future work" causes:
- Duplicate effort (re-running `wrangler deploy` when it's already live)
- Confusion about what's left to do (is M6 about deployment or about product features?)
- Wasted time debugging "why can't I deploy?" when it's already deployed

**Mitigation checklist** (enforce going forward):
1. **Deployment state must be tracked in frontmatter**, not just in a prose "Execution status" paragraph at the end. Example:
   ```yaml
   ---
   status: complete  # or: planned | in-progress | complete
   executed_date: 2026-06-09
   production_url: https://pomo-stretch.michal3run.workers.dev
   ---
   ```
2. **Roadmap generation must check deployment state explicitly**. If `context/changes/deployment/` exists, read the **status field** and adjust the roadmap accordingly. Don't assume "plan file exists = not executed."
3. **Baseline State section should reference deployment plan status** as the source of truth. Example: "Per deployment-plan.md (status: complete, 2026-06-09), infrastructure is live at [URL]."
4. **M6 deployment section should say "already deployed" if true**, not list deployment as future work.
5. **When deployment completes, update the deployment-plan.md frontmatter immediately** — don't rely on prose at the bottom.

**Corrective actions taken** (2026-07-11):
- Updated roadmap.md in 6 places to reflect actual deployment status (Baseline State, Current capabilities, M6 Acceptance Criteria, M6 Deployment Checklist, M6 Handoff, DoD, Version History)
- Deployment-plan.md already had correct status (no change needed)
- Added this lesson to prevent recurrence

**Guideline**: Every change folder that involves infrastructure, deployment, or external account setup should have a **machine-readable status field** in its frontmatter. Status should be one of: `planned`, `in-progress`, `complete`, `abandoned`. Roadmap generation (and other skills) must check this field, not infer status from file existence.

---

### L11: Plans Must Define Contracts, Not Just Intent (Astro/React Boundaries & Conventions)
**Date**: 2026-07-25  
**Context**: `10x-plan` generation for M2 Pomodoro Timer, caught by `10x-plan-review`.

**Problem**: The planning agent read `AGENTS.md` and `research.md` perfectly but generated a plan that violated known boundaries:
1. It left the `TimerState` type inline instead of moving it to `src/types.ts` as strictly dictated by `AGENTS.md`.
2. It wrote "displays Banner.astro" inside a React island, which violates Astro's core architectural boundary (Astro components cannot mount inside React client components).
3. It used soft language like "Exports prerender = false (if required)" instead of committing to a hard contract.

**Why this happened**: When LLMs generate implementation plans, their attention mechanism focuses on the *feature intent* (e.g., "show a warning") and often drops the *strict architectural constraints* (e.g., "Astro components cannot run in React"). The LLM "knows" the rule, but fails to apply it unless forced to verify boundaries explicitly.

**Mitigation checklist** (enforced during `/10x-plan` and `/10x-plan-review`):
1. **Never write "if required", "as needed", or "refactor accordingly" in a plan**. A plan must make the architectural decision. If you don't know, research it.
2. **Explicit Boundary Check**: Whenever a plan involves Astro islands (`client:load`), explicitly check if the phase attempts to import or use `.astro` files inside `.tsx`. This is an architectural failure.
3. **Explicit Convention Check**: Before finalizing Phase blocks, mechanistically map the `AGENTS.md` rules (e.g., shared types in `src/types.ts`) to the specific phase outputs.

**Guideline**: A plan is a contract, not a wishlist. When writing a plan, treat every bullet point as executable code. If the bullet point says "use Banner.astro here", ask yourself: "Will the compiler allow this?". If the answer is no, the plan is broken.
