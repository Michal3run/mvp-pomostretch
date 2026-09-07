# PomoStretch Landing Page Redesign — Plan Brief

> Full plan: `context/changes/landing-page-redesign/plan.md`
> Related change: `context/changes/landing-page-redesign/change.md`
> PRD context: `context/foundation/prd.md`

## What & Why

Transform the default root entry page (`/`) from a generic starter kit template ("10x Astro Starter") into a modern, domain-focused landing page for PomoStretch. The page must instantly explain the product's core innovation — merging a Pomodoro focus timer with pain-aware ergonomic stretching routines — and provide an intuitive funnel for both new visitors and returning users.

## Starting Point

- `src/pages/index.astro` renders `<Welcome />`.
- `src/components/Welcome.astro` contains hardcoded starter copy: *"10x Astro Starter"*, generic cards about TypeScript/Tailwind/Supabase, and static links.
- Returning signed-in users on `/` still see "Sign In / Sign Up" hero buttons instead of a direct path to their dashboard.

## Desired End State

- Visiting `/` presents a modern, polished dark-mode landing page featuring the PomoStretch brand, clear value propositions, interactive visual mockups of the 3-step loop, and desk-worker testimonials/features.
- The hero CTA dynamically checks authentication: unauthenticated users see "Rozpocznij za darmo" / "Zaloguj się", while signed-in users see "Przejdź do Dashboardu" / "Wznów sesję".
- Preserves the cosmic visual language (`bg-cosmic`, glassmorphism, blur orbs) while eliminating all traces of boilerplate copy.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Page Architecture | Pure Astro SSR with server-side auth check | Keeps 0kb JavaScript payload on landing, loads instantly on edge, SEO friendly | Plan |
| Component Structure | Modularize into `Welcome.astro` (or specialized subcomponents) | Clean separation between Hero, Workflow Steps, and Value Pillars | Plan |
| Visual Mockups | Pure CSS + SVG illustrations of Timer & Exercise Card | High performance, no heavy external images or 3D canvas libraries | Plan |
| Authentication Handling | Read `Astro.locals.user` in `index.astro` | Personalizes CTAs immediately without client-side redirect flashes | Plan |

## Scope

**In scope:**
- Redesigning `src/components/Welcome.astro` (or replacing with dedicated landing sections).
- Dynamic CTA adapting to `Astro.locals.user`.
- Responsive layout (mobile, tablet, desktop).
- Showcasing the 3-step loop: Pomodoro -> Pain Input -> Personalized Exercises.

**Out of scope:**
- Modifying protected routes (`/dashboard`, `/break-input`, `/exercise-sequence`, `/history`).
- Modifying backend APIs or database tables.
- Adding complex marketing tracking/analytics scripts.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Hero & Dynamic CTA Redesign | Modern hero with PomoStretch branding, value proposition, and user-aware CTAs | CSS overflow or responsive text truncation on mobile |
| 2. Workflow & Value Pillars Section | 3-step loop visualization and ergonomic feature grid | Visual clutter or inconsistent spacing |
| 3. Polishing & E2E Sanity Check | Micro-interactions, footer, and automated verification | Broken navigation links |

**Prerequisites:** Phase 1 of `mvp-submission-remediation` completed.
**Estimated effort:** 1 focused implementation session across 3 phases.

## Success Criteria (Summary)

- Root URL displays PomoStretch branding and clear ergonomic focus messaging.
- Logged-in users see a direct link to `/dashboard`.
- Build and linter pass with 0 errors.
