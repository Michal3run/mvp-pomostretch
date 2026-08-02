# Research: Milestone 5 (Break History CRUD)

## Problem Statement

Milestone 5 promotes break session history from ephemeral client storage to a fully managed Supabase Postgres table with RLS enforcement and complete CRUD capability.

## Internal Codebase Evidence

1. **Database Schema & RLS**:
   - `supabase/migrations/20260715120100_create_break_session_table.sql` creates `break_session` table with columns: `id`, `user_id`, `created_at`, `ended_at`, `input_kind`, `input_value`, `derived_tags`, `selected_exercise_ids`, `completed_count`, `skipped_count`, `note`.
   - Index `break_session_user_id_created_at_idx` optimizes `ORDER BY created_at DESC`.
   - RLS policies restrict all SELECT, INSERT, UPDATE, DELETE operations to `auth.uid() = user_id`.

2. **Auth & Middleware Context**:
   - `src/middleware.ts` populates `context.locals.user` and `context.locals.supabase`.
   - Gated routes array `PROTECTED_ROUTES` must include `/history`.

3. **API Conventions**:
   - Astro server API handlers (`export const prerender = false`).
   - Standard response signatures returning JSON `{ data }` or `{ error }` with appropriate status code (401, 400, 404, 200, 201).
