# PomoStretch Landing Page Redesign Implementation Plan

## Overview

Replace the default "10x Astro Starter" landing page at `src/pages/index.astro` and `src/components/Welcome.astro` with a bespoke, high-converting, and modern landing page for PomoStretch. The new design presents the product's core value proposition — smart Pomodoro focus paired with personalized, pain-targeted stretching routines for desk workers — while integrating dynamically with the user's authentication state.

## Current State Analysis

1. **Placeholder Copy**: `src/components/Welcome.astro` features the headline `"10x Astro Starter"` with description `"A production-ready starter with authentication, modern tooling, and a cosmic developer experience."`
2. **Generic Feature Grid**: The cards highlight framework features (TypeScript, Tailwind, Supabase) rather than product features (Pomodoro timer, ergonomic breaks, rule engine, session history).
3. **Static CTA Buttons**: The hero hardcodes links to `/auth/signin` and `/auth/signup`. If an authenticated user visits `/`, they are presented with sign-in/up prompts instead of a clean transition to `/dashboard`.
4. **Visual Assets**: The page already has a well-designed cosmic theme (`bg-cosmic`, glassmorphism, background radial gradients, and blur orbs) that can be reused and elevated.

## Desired End State

1. **Brand & Value Alignment**: Visitors immediately understand that PomoStretch is an ergonomic focus tool designed for programmers and desk workers to prevent pain in neck, eyes, shoulders, and lower back.
2. **Dynamic Server-Rendered CTAs**:
   - For guests: "Zacznij za darmo" (primary button -> `/auth/signup`) and "Zaloguj się" (ghost/secondary button -> `/auth/signin`).
   - For authenticated users: "Wróć do sesji (Dashboard)" (primary -> `/dashboard`) and "Twoja historia" (secondary -> `/history`).
3. **3-Step Workflow Showcase**: Clear visual walkthrough of the product loop:
   - **Krok 1: Skupienie (Pomodoro)** — 25 minut głębokiej pracy bez rozpraszaczy.
   - **Krok 2: Diagnoza w 3 sekundy** — Szybki wybór miejsca dyskomfortu (kark, oczy, plecy, barki).
   - **Krok 3: Spersonalizowana ulga** — Ćwiczenia dopasowane do bólu z timerem i bez powtórek z rzędu.
4. **Feature Grid for Desk Workers**:
   - _Inteligentny silnik reguł_: Algorytm dbający o to, by nie powtarzać tych samych ćwiczeń i zawsze dobierać ćwiczenia do zgłoszenia.
   - _100% przy biurku_: Bez maty, bez przebierania się – dyskretne ćwiczenia biurowe.
   - _Prywatność i Kontrola_: Dziennik przerw z notatkami, pełny CRUD, dane chronione RLS.
   - _Ultra-szybki Edge SSR_: Działa w Cloudflare Workers, pamięta stan timera po odświeżeniu.
5. **Polished Micro-elements**:
   - Ergonomic pain badges preview (`#kark`, `#oczy`, `#barki`, `#lędźwie`).
   - Clean, modern footer with product summary and GitHub/course notes.

### Key Discoveries:

- `src/components/Topbar.astro:L2`: Already implements user detection via `const { user } = Astro.locals;`. We can apply this exact pattern in the landing page hero.
- `src/styles/global.css`: Contains CSS variables and `bg-cosmic` background configuration that should be maintained for brand consistency.
- `lucide-react`: Already available in `package.json` for icons (e.g. `Timer`, `Activity`, `Sparkles`, `ShieldCheck`, `ArrowRight`).

## What We're NOT Doing

- Not converting the entire landing page to a heavy client-side React SPA (keep it Astro SSR for 0kb initial JS overhead).
- Not adding external third-party tracking scripts or cookies.
- Not altering auth routes (`/auth/signin`, `/auth/signup`) or dashboard mechanics.

## Implementation Approach

- Build pure Astro components to retain server-first speed and SEO friendliness.
- Use Tailwind 4 utility classes matching the existing cosmic aesthetic (`border-white/10`, `bg-white/5`, `backdrop-blur-xl`, gradients `from-purple-400 to-pink-300`).
- Ensure complete responsiveness across mobile (<640px), tablet, and desktop viewports.

## Critical Implementation Details

- **Tailwind 4 Gradient Syntax**: Use standard Tailwind 4 gradient and color utilities (`bg-linear-to-r` or `bg-gradient-to-r` compatible with project config).
- **Safe SSR Auth Extraction**: Check `Astro.locals.user` directly in frontmatter. If present, render dashboard links; otherwise render sign-in/up links.

---

## Phase 1: Hero & Dynamic Authentication Funnel

### Overview

Redesign the Hero section of `src/components/Welcome.astro` to introduce PomoStretch with high-impact copywriting, a pain-tag preview, and dynamic CTA buttons that adapt based on the user's authentication status.

### Changes Required:

#### 1. Landing Hero Redesign

**File**: `src/components/Welcome.astro`
**Intent**: Replace "10x Astro Starter" heading and generic paragraph with PomoStretch branding, ergonomic value proposition, and user-aware CTA buttons.
**Contract**:

- Frontmatter reads `const user = Astro.locals.user;`.
- Displays badge: _"Dla programistów i pracowników biurowych"_.
- Main title: _"Skup się na kodzie. Rozciągaj tam, gdzie boli."_ with vibrant gradient text.
- Subtitle explains the 25-minute Pomodoro + 3-minute pain-targeted stretch sequence.
- Primary CTA:
  - If `user`: links to `/dashboard` (_"Przejdź do Dashboardu"_) with arrow icon.
  - If guest: links to `/auth/signup` (_"Zacznij za darmo"_) and `/auth/signin` (_"Zaloguj się"_).
- Visual pain-tags pill preview: `[ #kark ]`, `[ #oczy ]`, `[ #barki ]`, `[ #lędźwie ]`.

### Success Criteria:

#### Automated Verification:

- Linter passes: `npm run lint`
- Astro build succeeds: `npm run build`

#### Manual Verification:

- Open `http://localhost:4321` as guest: verifies "Zacznij za darmo" and "Zaloguj się" buttons.
- Open `http://localhost:4321` logged in: verifies "Przejdź do Dashboardu" appears.

---

## Phase 2: Interactive Workflow Showcase & Value Pillars

### Overview

Add an interactive 3-step workflow demonstration and a 4-card value pillar grid explaining how PomoStretch solves desk-worker fatigue.

### Changes Required:

#### 1. Workflow & Feature Grid Implementation

**File**: `src/components/Welcome.astro`
**Intent**: Replace the generic TypeScript/Tailwind cards with:

1. **Pętla PomoStretch (3 kroki)**:
   - Step 1: _25 min Skupienia_ (Timer Pomodoro z ochroną sesji).
   - Step 2: _3 sekundy Diagnozy_ (Szybki wybór: Kark, Oczy, Barki, Plecy).
   - Step 3: _Spersonalizowana Ulga_ (Ćwiczenia dopasowane do bólu, bez powtórek).
2. **4 Filary Produktu**:
   - _Inteligentny Rule Engine_: Algorytm dobiera ćwiczenia na podstawie zgłoszonego dyskomfortu.
   - _Ergonomia bez siłowni_: Ćwiczenia w 100% wykonalne przy biurku bez sprzętu.
   - _Dziennik i Postępy_: Historia przerw z notatkami, wgląd w samopoczucie.
   - _Prywatność i Szybkość_: Zabezpieczenie danych na poziomie bazy (RLS) i edge runtime Cloudflare.
     **Contract**:

- Cards use glassmorphic styling (`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg hover:border-purple-500/30 transition`).
- Semantic icons and accessible headings.

### Success Criteria:

#### Automated Verification:

- Linter passes: `npm run lint`
- Build passes: `npm run build`

#### Manual Verification:

- Verify that cards render with clean typography and proper spacing on mobile, tablet, and wide screens.

---

## Phase 3: Footer, Responsive Polish & Verification

### Overview

Add a polished footer, refine mobile spacing, and ensure clean contrast across the entire page.

### Changes Required:

#### 1. Footer & Meta Alignment

**File**: `src/components/Welcome.astro`
**Intent**: Add a minimal, elegant footer with copyright, stack credits (Astro, Supabase, Cloudflare), and direct navigation links.
**File**: `src/pages/index.astro`
**Intent**: Ensure the layout title is `"PomoStretch — Inteligentne Pomodoro & Rozciąganie dla Programistów"`.
**Contract**:

- Clean footer without broken links.
- Meta title and description aligned with PomoStretch branding.

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test`
- Playwright tests pass: `npm run test:e2e`
- Linter passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Verify that navigating from `/` to `/auth/signup` and `/dashboard` functions seamlessly.

---

## Progress

### Phase 1: Hero & Dynamic Authentication Funnel

#### Automated

- [x] 1.1 Linter passes via npm run lint
- [x] 1.2 Astro build succeeds via npm run build

#### Manual

- [x] 1.3 Hero renders PomoStretch branding and pain tags
- [x] 1.4 Dynamic CTA switches correctly between guest and authenticated states

### Phase 2: Interactive Workflow Showcase & Value Pillars

#### Automated

- [x] 2.1 Linter passes via npm run lint
- [x] 2.2 Astro build succeeds via npm run build

#### Manual

- [x] 2.2 3-step workflow and 4-card feature grid display cleanly across viewports

### Phase 3: Footer, Responsive Polish & Verification

#### Automated

- [x] 3.1 Unit tests pass via npm test
- [x] 3.2 Playwright E2E suite passes via npm run test:e2e
- [x] 3.3 Production build succeeds via npm run build

#### Manual

- [x] 3.4 Verify visual design and smooth navigation from root page
