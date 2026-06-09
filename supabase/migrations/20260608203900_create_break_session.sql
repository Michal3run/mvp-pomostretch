-- Migration: create break_session table for user-owned CRUD
-- Source: context/changes/session-history-crud/change.md
-- Purpose: promote break-session record from localStorage to Supabase Postgres
-- with full 4-verb user-owned CRUD + RLS (closes course-CRUD gap).

-- Enable pgcrypto for gen_random_uuid() (idempotent — already enabled on most Supabase projects).
create extension if not exists pgcrypto;

-- ──────────────────────────────────────────────────────────────────────────────
-- Table
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.break_session (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),
  ended_at              timestamptz,
  input_kind            text not null check (input_kind in ('quick_pick', 'free_text')),
  input_value           text not null check (char_length(input_value) <= 500),
  derived_tags          text[] not null default '{}',
  selected_exercise_ids uuid[] not null default '{}',
  completed_count       int  not null default 0 check (completed_count >= 0),
  skipped_count         int  not null default 0 check (skipped_count   >= 0),
  note                  text check (note is null or char_length(note) <= 500)
);

-- Index for the "Historia przerw" list query (newest first, per user).
create index if not exists break_session_user_created_idx
  on public.break_session (user_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.break_session enable row level security;

-- A user can read only their own rows.
drop policy if exists "break_session_select_own" on public.break_session;
create policy "break_session_select_own"
  on public.break_session for select
  to authenticated
  using (user_id = (select auth.uid()));

-- A user can insert only rows owned by themselves.
drop policy if exists "break_session_insert_own" on public.break_session;
create policy "break_session_insert_own"
  on public.break_session for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- A user can update only their own rows.
-- (Field-level immutability — only `note`, `ended_at`, `completed_count`,
-- `skipped_count` are exposed for update — is enforced in the API route, not in
-- SQL, to keep the column list flexible without a trigger.)
drop policy if exists "break_session_update_own" on public.break_session;
create policy "break_session_update_own"
  on public.break_session for update
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- A user can delete only their own rows.
drop policy if exists "break_session_delete_own" on public.break_session;
create policy "break_session_delete_own"
  on public.break_session for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────────
-- Notes
-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Field-level update whitelist (only note / ended_at / counts editable) is
--    enforced in src/pages/api/sessions/[id].ts, NOT here. Postgres RLS only
--    gates row-level access; column-level rules belong above the DB.
-- 2. selected_exercise_ids is a uuid[] but does NOT reference an `exercise`
--    table because the catalog table doesn't exist yet (catalog is post-MVP
--    server-side per shape-notes; in MVP it lives in TS as a seed). When the
--    catalog table lands, add a CHECK trigger to validate ids against it.
-- 3. ended_at NULL = abandoned break (closed tab mid-flow). Set when user
--    confirms "Resume work?" or skips the whole break.
