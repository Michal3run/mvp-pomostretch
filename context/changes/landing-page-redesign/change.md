---
change_id: landing-page-redesign
status: impl_reviewed
created: 2026-09-07
updated: 2026-09-12
owner: solo
type: feature
blocks_certification: false
related_prd_sections:
  - "## Vision & Problem Statement"
  - "## User & Persona"
  - "## Information & Onboarding"
related_frs: [FR-001, FR-004]
---

# Change: PomoStretch Landing Page Redesign (`landing-page-redesign`)

> **One-line summary.** Replace the generic "10x Astro Starter" placeholder on the index page (`/`) with a modern, high-converting, ergonomic-themed landing page showcasing PomoStretch's unique value proposition, smart Pomodoro flow, and personalized stretch routines.

## Context & Motivation

Currently, navigating to the root URL (`/`) presents the default Astro template:

> _"10x Astro Starter — A production-ready starter with authentication, modern tooling, and a cosmic developer experience."_

This creates a jarring disconnect for course evaluators and real users. PomoStretch is a domain-driven product addressing desk-worker ergonomics and pain prevention. The landing page should communicate what the app does in 3 seconds, showcase the Pomodoro + Ergonomics loop, adapt dynamically if the user is already authenticated, and reinforce the cosmic/dark-mode aesthetic of the application.

## Key Deliverables

1. **Hero Section**:
   - Compelling value-driven headline: _"Skup się na kodzie. Rozciągaj tam, gdzie boli."_
   - Clear sub-headline explaining the hybrid Pomodoro + pain-aware stretch sequence loop.
   - Dynamic Call-To-Action (CTA):
     - Unauthenticated: _"Rozpocznij za darmo"_ (`/auth/signup`) + _"Zaloguj się"_ (`/auth/signin`).
     - Authenticated: _"Przejdź do Dashboardu"_ (`/dashboard`) + _"Zobacz historię"_ (`/history`).

2. **The 3-Step Interactive Workflow Loop**:
   - Step 1: **25 min Focus** (Pomodoro timer with local persistence).
   - Step 2: **3-sec Pain Check** (Quick picks for Neck, Eyes, Shoulders, Lower Back, or free text).
   - Step 3: **Personalized Stretch Sequence** (Targeted desk-friendly exercises with countdown and no-repeat memory).

3. **Feature / Value Pillars**:
   - _Inteligentny dobór (Rule Engine)_: Dopasowanie do konkretnego bólu, zero nudnych powtórek.
   - _100% przy biurku_: Ćwiczenia niewymagające sprzętu ani maty gimnastycznej.
   - _Prywatność i Historia_: Dziennik przerw i samopoczucia zabezpieczony RLS.
   - _Błyskawiczna wydajność_: Edge SSR na Cloudflare Workers i odporność na odświeżenie karty.

4. **Component Architecture**:
   - Refactor `src/components/Welcome.astro` into `src/components/LandingHero.astro` and `src/components/LandingFeatures.astro` (or clean `Welcome.astro` redesign).
   - Read `Astro.locals.user` to tailor navigation and CTAs automatically.
