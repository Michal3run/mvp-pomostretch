<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Rozbudowa bazy ćwiczeń (x2), 6 kafelków i ilustracje SVG (`exercise-catalog-expansion`) — Faza 4

- **Plan**: context/changes/exercise-catalog-expansion/plan.md
- **Scope**: Phase 4 of 5 (Migracja SQL powiększająca bazę do 73 ćwiczeń)
- **Date**: 2026-09-12
- **Verdict**: APPROVED WITH OBSERVATIONS
- **Findings**: 0 critical, 1 warning, 3 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | PASS    |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | PASS    |

## Findings

### F1 — Manual application of SQL migration required on Supabase (Deploy does not run migrations)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; operational action required
- **Dimension**: Safety & Quality / Operations
- **Location**: `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql`
- **Detail**: The migration file has been committed to the repository in commit `463e880`. However, neither Cloudflare Workers Builds nor GitHub Actions CI executes Supabase SQL migrations. As noted in `infrastructure.md` and `lessons.md` (L10/L13), application deployment on Cloudflare is purely code/asset deployment. Unless this SQL migration is explicitly applied to the Supabase database instance (via Supabase Dashboard SQL Editor or Supabase CLI `db push`), the live database will retain only the 35 legacy exercises without `glutes_hips` or `wrists_hands` tags, causing the rule engine to fall back to `general` on live environments.
- **Fix**: Apply the migration to the remote Supabase project via the Supabase Dashboard SQL Editor or `npx supabase db push`.
- **Decision**: PENDING (Awaiting developer action via Supabase SQL Editor / CLI)

### F2 — Partial tag updates on legacy exercise records

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; non-blocking
- **Dimension**: Safety & Quality
- **Location**: `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql:3-6`
- **Detail**: The migration includes two UPDATE statements to retag legacy rows:
  ```sql
  UPDATE public.exercise SET body_areas = ARRAY['wrists_hands', 'general'] WHERE 'general' = ANY(body_areas) AND (name ILIKE '%dłoń%' OR name ILIKE '%nadgarstk%');
  UPDATE public.exercise SET body_areas = ARRAY['glutes_hips', 'lower_back'] WHERE 'lower_back' = ANY(body_areas) AND (name ILIKE '%biodr%' OR name ILIKE '%poślad%');
  ```
  Certain legacy exercises from migrations `20260802110000` and `20260802143000` do not match these specific filters:
  - `Stretch zginaczy bioder stojąc` has `ARRAY['general']` (not `lower_back`), so it is not updated.
  - `Rozciąganie mięśnia gruszkowatego w krześle` has name containing `gruszkowat`, not `biodr` or `poślad`.
  - `Gimnastyka ścięgien palców` has name containing `palców`, not `dłoń` or `nadgarstk`.
  - `Pozycja czwórki siedząc` has name without `biodr`/`poślad` and tags `general`.
  These legacy exercises remain under their old categories. This is non-breaking because the 38 newly seeded exercises provide full coverage (12 for `glutes_hips`, 8 for `wrists_hands`), but these legacy records remain in `general`/`lower_back`.
- **Fix**: Optionally expand the UPDATE query or add a follow-up patch if legacy rows should also be retagged.
- **Decision**: ACCEPTED AS IS (38 new exercises provide complete coverage; legacy rows remain functional).

### F3 — Idempotent migration design adheres to Lesson L19

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — positive pattern
- **Dimension**: Pattern Consistency
- **Location**: `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql:10-51`
- **Detail**: In accordance with Lesson L19 (`Database Migrations with Seed Data Lack Idempotency Without Explicit Conflict Resolution`), the migration incorporates `WHERE NOT EXISTS (SELECT 1 FROM public.exercise e WHERE e.name = v.name)` for the 38 newly added rows and `ADD COLUMN IF NOT EXISTS image text`. Because `exercise.name` has a `UNIQUE` constraint from migration `20260802143000`, the migration can be safely re-run without duplicate key violations or orphan duplicate rows.
- **Decision**: PASS (Best practice adherence).

### F4 — Offline fallback catalog alignment (Lesson L14)

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — positive pattern
- **Dimension**: Plan Adherence & Safety
- **Location**: `src/lib/exercise-catalog.ts:46,55`
- **Detail**: `FALLBACK_EXERCISE_CATALOG` was updated with representative entries for `wrists_hands` and `glutes_hips` along with existing zones (`neck`, `eyes`, `shoulders`, `lower_back`, `general`). If Supabase is unreachable or in offline local development, the client-side rule engine in `useExerciseSequence` still provides appropriate exercises for all 6 quick-pick cards without dead-ends. All referenced SVGs exist in `public/images/`.
- **Decision**: PASS.
