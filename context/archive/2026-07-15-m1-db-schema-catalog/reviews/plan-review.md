<!-- PLAN-REVIEW-REPORT -->
# Plan Review: M1: Database Schema & Exercise Catalog Implementation Plan

- **Plan**: `context/changes/m1-db-schema-catalog/plan.md`
- **Mode**: Deep
- **Date**: 2026-07-15
- **Verdict**: SOUND
- **Findings**: 0 critical, 1 warnings, 1 observations

## Verdicts

| Dimension | Verdict |
|---|---|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | PASS |

## Grounding
Grounding: 5/5 paths ✓, 3/3 symbols ✓, brief↔plan ✓

## Findings

### F1 — break_session.derived_tags allows empty array {}

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — Break Session Table Schema & RLS Policies
- **Detail**: The `break_session.derived_tags` column is defined as `text[] NOT NULL`. However, `NOT NULL` in Postgres allows an empty array `{}`. If an API handler inserts an empty array, the record will lack any categorization tags, violating the expectation that every break session has at least one tag (such as `general`).
- **Fix**: Add `CHECK (array_length(derived_tags, 1) > 0)` to `break_session` DDL alongside the existing check constraints on `input_kind`, `selected_exercise_ids`, and `note`.
- **Decision**: FIXED (Added `array_length(derived_tags, 1) > 0` check constraint to Phase 2 Intent)

### F2 — selected_exercise_ids array lacks database-level FK enforcement

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 2 — Break Session Table Schema & RLS Policies
- **Detail**: Storing `selected_exercise_ids` as a Postgres array (`uuid[]`) aligns with the roadmap's lean schema design (`FR-023`). However, standard Postgres `FOREIGN KEY` constraints cannot be applied directly to elements of an array column (`uuid[] REFERENCES exercise(id)` is invalid syntax). As a result, deleting an exercise from the catalog or inserting a non-existent UUID into `break_session.selected_exercise_ids` will not trigger a foreign key violation at the database level.
- **Fix**: Retain `uuid[]` as specified by the roadmap for lean MVP execution, but add an explicit SQL comment on the column noting that referential integrity is enforced at the application layer (`src/lib/rule-engine.ts`) or via a post-MVP trigger if needed.
- **Decision**: PENDING
