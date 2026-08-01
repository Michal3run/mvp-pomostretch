# M1: Database Schema & Exercise Catalog — Plan Brief

> Full plan: `context/changes/m1-db-schema-catalog/plan.md`
> Roadmap: `context/foundation/roadmap.md`

## What & Why

We are establishing the database schema and seed data for PomoStretch (`M1: Database Schema & Exercise Catalog`). This horizontal foundation creates the `exercise` table with 15 ergonomic exercises covering all 4 quick-pick areas (`eyes`, `neck`, `shoulders`, `lower_back`) and `general`, plus the `break_session` table with granular RLS policies. This schema directly unblocks two core vertical slices: M4 (Exercise Selection & Sequence) and M5 (Break History CRUD).

## Starting Point

Currently, Supabase authentication is operational (`auth.users` exists and auth routes function correctly), but the `supabase/migrations/` directory does not exist and no domain tables are deployed to the local or staging database.

## Desired End State

When complete, two timestamped SQL migrations (`exercise` and `break_session`) are present in `supabase/migrations/` and cleanly applied via `npx supabase db reset`. The `exercise` table contains 15 queryable rows ready for M4's rule engine, and `break_session` guarantees strict per-user data isolation via RLS policies ready for M5's history management.

## Key Decisions Made

| Decision                 | Choice                                                                                                | Why (1 sentence)                                                                                                     | Source  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| Seed Data Location       | Embed `INSERT` statements inside the SQL migration file                                               | Keeps schema DDL and initial catalog data atomic, version-controlled, and deterministic across dev/staging           | Roadmap |
| Exercise Catalog Access  | Public read (`SELECT`) for `authenticated` role via RLS                                               | All logged-in users need to browse and receive recommendations from the shared catalog without per-user restrictions | Roadmap |
| `break_session` Security | Granular RLS policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) checked against `auth.uid() = user_id` | Enforces zero-trust data isolation so users can only view or modify their own break records                          | Roadmap |
| Cascade Deletion         | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`                                   | Automatically cleans up break history rows when a user account is deleted, preventing orphaned data                  | Roadmap |

## Scope

**In scope:**

- Creating `supabase/migrations/` directory.
- Writing `YYYYMMDDHHmmss_create_exercise_table.sql` with check constraints and 15 seed rows across 5 body areas.
- Writing `YYYYMMDDHHmmss_create_break_session_table.sql` with check constraints, composite index, and 4 RLS policies.
- Automated and manual verification of schema, seed counts, and RLS isolation.

**Out of scope:**

- API endpoints (`/api/break-input`, `/api/sessions`).
- UI screens and pages (`/break-input`, `/exercise-sequence`, `/history`).
- TypeScript rule engine (`src/lib/rule-engine.ts`).

## Architecture / Approach

We write two clean, idempotent SQL migrations. Migration 1 (`20260715120000_create_exercise_table.sql`) sets up the `exercise` table and seed data. Migration 2 (`20260715120100_create_break_session_table.sql`) sets up the `break_session` table and links it via foreign key to `auth.users`, applying `auth.uid() = user_id` checks across all CRUD operations.

## Phases at a Glance

| Phase                                        | What it delivers                                                                                | Key risk                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1. Exercise Table Schema & Seed Data         | `exercise` table DDL, check constraints, RLS read access, and 15 seed exercises                 | Seed data fails to cover $\ge 2$ rows per body area (`eyes`, `neck`, `shoulders`, `lower_back`, `general`) |
| 2. Break Session Table Schema & RLS Policies | `break_session` DDL, FK to `auth.users`, index `(user_id, created_at DESC)`, and 4 RLS policies | RLS policy gaps allowing cross-user reads or updates                                                       |

**Prerequisites:** Local Supabase CLI installed (`npx supabase`) or local/remote Postgres instance accessible.
**Estimated effort:** ~3-4 hours (2 implementation phases).

## Open Risks & Assumptions

- **Seed Data Quality:** Exercise descriptions must be practical, original ergonomic advice (50–200 characters) to avoid low-quality or copyrighted text.
- **RLS Update Safety:** The `UPDATE` policy on `break_session` must specify both `USING` and `WITH CHECK` clauses so that a user cannot update `user_id` to transfer ownership of their row to another user.

## Success Criteria (Summary)

- `npx supabase db reset` applies both migrations without errors.
- `SELECT COUNT(*) FROM exercise;` returns 15, and every body area (`eyes`, `neck`, `shoulders`, `lower_back`, `general`) has $\ge 2$ rows.
- `break_session` RLS policies verified to block user B from accessing or modifying user A's rows.
