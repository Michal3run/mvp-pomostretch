# M1: Database Schema & Exercise Catalog Implementation Plan

## Overview

We are implementing Milestone 1 (M1) from the project roadmap: creating the initial database schema and seed data in Supabase Postgres. This bounded horizontal milestone establishes two core tables (`exercise` and `break_session`) via SQL migrations. It provides the exercise catalog (`exercise`) with 15 seed exercises across 4 body areas (`eyes`, `neck`, `shoulders`, `lower_back`) plus `general`, and defines the user break history table (`break_session`) with granular Row Level Security (RLS) policies enforcing strict user ownership. This work directly unblocks M4 (Exercise Selection & Sequence) and M5 (Break History CRUD).

## Current State Analysis

- The project (`PomoStretch`) is an Astro 6 SSR app with Supabase authentication (`auth.users` table exists and `auth` flow is implemented at `src/pages/auth/`).
- Currently, `supabase/config.toml` exists, but the `supabase/migrations/` directory does not yet exist. There are no domain database tables deployed (`exercise` and `break_session` are missing).
- Without the `exercise` table and seed data, the rule engine in M4 cannot query or recommend exercises (FR-020, FR-021, FR-022).
- Without the `break_session` table and RLS policies, M5 cannot persist or query completed break sessions (FR-023 through FR-027).

## Desired End State

Two Supabase SQL migration files in `supabase/migrations/` that apply cleanly on local dev (`npx supabase db reset`) and staging:
1. `exercise` table created with check constraints on `duration_seconds` ($30 \le \text{duration} \le 120$) and `body_areas` (`array_length > 0`), RLS enabled with a `SELECT` policy for `authenticated` users, and 15 original seed rows covering `eyes`, `neck`, `shoulders`, `lower_back`, and `general` ($\ge 2$ per area).
2. `break_session` table created with a foreign key `user_id REFERENCES auth.users(id) ON DELETE CASCADE`, check constraints (`input_kind`, `selected_exercise_ids` length between 1 and 3, `note` length $\le 500$), an index `(user_id, created_at DESC)`, RLS enabled, and 4 granular policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) ensuring `user_id = auth.uid()`.

### Key Discoveries:

- `supabase/config.toml:L1` defines the local Supabase environment configuration, confirming standard Postgres/Supabase setup.
- `context/foundation/roadmap.md:L156-L260` specifies exact column types, constraints, seed coverage requirements ($\ge 2$ exercises per body area), and RLS rules for both tables.

## What We're NOT Doing

- We are NOT building any API routes (`/api/break-input` or `/api/sessions`) or modifying existing API handlers.
- We are NOT building any UI components or pages (`/break-input`, `/exercise-sequence`, `/history`).
- We are NOT implementing the TypeScript rule engine or keyword matcher logic (`src/lib/rule-engine.ts`, `src/lib/keyword-matcher.ts`).
- We are NOT modifying Astro middleware or existing auth screens.

## Implementation Approach

We will create the `supabase/migrations/` directory and write two timestamped SQL migrations in sequence:
1. `YYYYMMDDHHmmss_create_exercise_table.sql` — creates the `exercise` table, enables RLS, grants `SELECT` to `authenticated`, and inserts 15 high-quality, original ergonomic exercises across the specified body areas.
2. `YYYYMMDDHHmmss_create_break_session_table.sql` — creates the `break_session` table with all check constraints, composite index `(user_id, created_at DESC)`, enables RLS, and creates 4 per-operation per-role policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for `user_id = auth.uid()`.

## Critical Implementation Details

- **Migration Naming**: Migrations must use timestamp prefixes (`date +%Y%m%d%H%M%S`). We will use `20260715120000_create_exercise_table.sql` and `20260715120100_create_break_session_table.sql` to guarantee deterministic execution order.
- **RLS Update Policy Security**: For `break_session` `UPDATE` policy, both `USING (auth.uid() = user_id)` and `WITH CHECK (auth.uid() = user_id)` must be specified. This ensures users can only update their own rows AND cannot change `user_id` to transfer ownership to another user.
- **Seed Data Quality & Coverage**: Exercise descriptions must be original (50–200 characters each) with practical ergonomic guidance. Every quick-pick area (`eyes`, `neck`, `shoulders`, `lower_back`, plus `general`) must have at least 2 distinct exercises matching when queried via `unnest(body_areas)`. Multi-tagged exercises (e.g., `ARRAY['neck', 'shoulders']`) are allowed and encouraged.

## Phase 1: Exercise Table Schema & Seed Data

### Overview

Create `supabase/migrations/` directory and write `20260715120000_create_exercise_table.sql` defining `exercise` DDL, RLS enablement, public-read policy (`SELECT` for `authenticated`), and 15 seed rows.

### Changes Required:

#### 1. Exercise Migration File

**File**: `supabase/migrations/20260715120000_create_exercise_table.sql`

**Intent**: Define `exercise` table structure, check constraints (`duration_seconds BETWEEN 30 AND 120`, `array_length(body_areas, 1) > 0`), enable RLS with `authenticated` read access, and insert 15 seed rows.

**Contract**: Table `exercise` created in `public` schema. Accessible via `SELECT` to `authenticated` users. `SELECT COUNT(*) FROM exercise` returns exactly 15. Each area (`eyes`, `neck`, `shoulders`, `lower_back`, `general`) matches $\ge 2$ exercises.

### Success Criteria:

#### Automated Verification:

- Migration syntax valid and applies cleanly via `npx supabase db reset`
- `SELECT COUNT(*) FROM exercise;` returns 15
- `SELECT unnest(body_areas) AS area, COUNT(*) FROM exercise GROUP BY area;` shows ≥2 for each area (`eyes`, `neck`, `shoulders`, `lower_back`, `general`)

#### Manual Verification:

- Inspect seed descriptions for quality and correct ergonomic advice (50-200 characters per exercise)

---

## Phase 2: Break Session Table Schema & RLS Policies

### Overview

Write `20260715120100_create_break_session_table.sql` defining `break_session` DDL, `user_id` foreign key referencing `auth.users(id)` with cascade deletion, check constraints, composite index, and 4 RLS policies.

### Changes Required:

#### 1. Break Session Migration File

**File**: `supabase/migrations/20260715120100_create_break_session_table.sql`

**Intent**: Create `break_session` table with appropriate data types, constraints (`input_kind IN ('quick_pick', 'free_text')`, `array_length(derived_tags, 1) > 0`, `array_length(selected_exercise_ids, 1) BETWEEN 1 AND 3`, `length(note) <= 500`), index `break_session_user_id_created_at_idx ON break_session (user_id, created_at DESC)`, enable RLS, and add `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies gated by `user_id = auth.uid()`.

**Contract**: Table `break_session` created in `public` schema. Strict user isolation enforced via RLS. Deleting a user in `auth.users` cascades to delete their `break_session` rows.

### Success Criteria:

#### Automated Verification:

- Migration applies cleanly (`npx supabase db reset`)
- Table structure verified (`\d break_session` shows columns, FK, check constraints, index, RLS enabled)

#### Manual Verification:

- Test RLS isolation using two mock auth users (`auth.uid() = user_A` vs `auth.uid() = user_B`): confirm user B cannot `SELECT`, `UPDATE`, or `DELETE` user A's rows, and cannot `INSERT` rows where `user_id = user_A`

---

## Testing Strategy

### Unit Tests:

- SQL validation queries checking seed counts (`COUNT(*) = 15`) and per-area coverage ($\ge 2$ rows per body area).

### Integration Tests:

- RLS policy verification across roles (`authenticated`, `anon`) and distinct `auth.uid()` values (`user_A` vs `user_B`).

### Manual Testing Steps:

1. Run `npx supabase start` (or connect to local Postgres dev instance).
2. Run `npx supabase db reset` to apply both migration files from clean state.
3. Verify table structures and check constraints using `psql`.
4. Execute `SELECT id, name, body_areas FROM exercise;` and inspect output.

## Performance Considerations

- The composite index `(user_id, created_at DESC)` on `break_session` ensures $O(\log N)$ query performance when fetching the user's recent sessions on the `/history` page ($p95 < 10\text{ms}$).
- `exercise` table queries perform fast sequential scans on 15 rows ($p95 < 5\text{ms}$).

## Migration Notes

- Migrations are sequential and non-destructive (new tables only).
- Apply `20260715120000_create_exercise_table.sql` first so `exercise` exists before `break_session` (`20260715120100_create_break_session_table.sql`).

## References

- Roadmap: `context/foundation/roadmap.md`
- Supabase config: `supabase/config.toml`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Exercise Table Schema & Seed Data

#### Automated

- [x] 1.1 Migration syntax valid and applies cleanly via `npx supabase db reset`
- [x] 1.2 `SELECT COUNT(*) FROM exercise;` returns 15
- [x] 1.3 `SELECT unnest(body_areas) AS area, COUNT(*) FROM exercise GROUP BY area;` shows ≥2 for each area

#### Manual

- [x] 1.4 Inspect seed descriptions for quality and correct ergonomic advice

### Phase 2: Break Session Table Schema & RLS Policies

#### Automated

- [ ] 2.1 Migration applies cleanly (`npx supabase db reset`)
- [ ] 2.2 Table structure verified (`\d break_session` shows columns, FK, check constraints, index, RLS enabled)

#### Manual

- [ ] 2.3 Test RLS isolation using two mock auth users (`auth.uid() = user_A` vs `auth.uid() = user_B`)
