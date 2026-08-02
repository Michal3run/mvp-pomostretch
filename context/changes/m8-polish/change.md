---
change_id: m8-polish
status: completed
created: 2026-08-02
owner: solo
type: polish
blocks_certification: false
related_prd_sections:
  - "## Information & Onboarding"
  - "## Database Catalog Expansion"
  - "## RLS Security Verification"
---

# Milestone 8: M8 Polish (Post-MVP) (`m8-polish`)

> **One-line summary.** Expand exercise catalog seed, add interactive Info Button modal for user onboarding and MVP evaluator notes, and add dedicated Playwright E2E security test for user data isolation under RLS.

## Key Deliverables

1. **Exercise Database Expansion**:
   - `supabase/migrations/20260802143000_seed_more_exercises.sql` expands catalog with extra exercise options for `eyes`, `neck`, `lower_back`.

2. **Info Modal (Onboarding)**:
   - `src/components/InfoButton.tsx` added to top of `dashboard.astro` to explain PomoStretch workflow, tips, and technical CRUD details for course evaluators.

3. **RLS Security E2E Test**:
   - `tests/e2e/rls-security.spec.ts` verifies multi-tenant data isolation, ensuring user A cannot view or delete user B's break session records.
