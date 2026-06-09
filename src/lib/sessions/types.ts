/**
 * Shared TypeScript types for the break_session entity.
 *
 * Source of truth: supabase/migrations/<ts>_create_break_session.sql
 * Keep these in sync with the SQL schema.
 */

export type InputKind = "quick_pick" | "free_text";

/**
 * One row in `public.break_session` — the canonical persisted shape.
 */
export interface BreakSession {
  id: string;
  user_id: string;
  created_at: string; // ISO timestamp
  ended_at: string | null;
  input_kind: InputKind;
  input_value: string;
  derived_tags: string[];
  selected_exercise_ids: string[];
  completed_count: number;
  skipped_count: number;
  note: string | null;
}

/**
 * Payload shape accepted by `POST /api/sessions`. Only fields the client
 * supplies at create time — the server fills in `id`, `user_id`, `created_at`,
 * and defaults the counts to 0 / `ended_at` to null.
 */
export interface CreateBreakSessionInput {
  input_kind: InputKind;
  input_value: string;
  derived_tags: string[];
  selected_exercise_ids: string[];
}

/**
 * Payload shape accepted by `PATCH /api/sessions/:id`. All fields optional;
 * unknown fields are rejected by the server-side validator. `note` is the
 * user-driven case (the U in CRUD); the rest are progress writes from the
 * exercise-sequence screen.
 */
export interface UpdateBreakSessionInput {
  note?: string | null;
  ended_at?: string | null;
  completed_count?: number;
  skipped_count?: number;
}

/**
 * Response shape for `GET /api/sessions`. Cursor pagination is deferred per
 * the change's open question #1 — for now we return the most recent
 * `BREAK_SESSION_LIST_LIMIT` rows.
 */
export interface ListBreakSessionsResponse {
  items: BreakSession[];
}

export const BREAK_SESSION_LIST_LIMIT = 50;
export const NOTE_MAX_LENGTH = 500;
export const INPUT_VALUE_MAX_LENGTH = 500;
