/**
 * Hand-written validators for break_session payloads.
 *
 * We deliberately avoid pulling in zod for the MVP — the surface is small
 * (two payload shapes, ~6 fields total), and adding a runtime dependency
 * here would commit us to a stack choice we haven't formally made yet.
 * If/when zod is added project-wide, this file becomes a thin wrapper.
 *
 * All validators return a discriminated union: `{ ok: true; value: T }` on
 * success, `{ ok: false; error: string }` on failure. Routes turn the
 * failure into a 400 response.
 */

import type { CreateBreakSessionInput, InputKind, UpdateBreakSessionInput } from "./types";
import { INPUT_VALUE_MAX_LENGTH, NOTE_MAX_LENGTH } from "./types";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const INPUT_KINDS: readonly InputKind[] = ["quick_pick", "free_text"] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isInputKind = (value: unknown): value is InputKind =>
  typeof value === "string" && (INPUT_KINDS as readonly string[]).includes(value);

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
};

/**
 * Whitelist of keys allowed in the `POST /api/sessions` body. Any extra key
 * causes a 400 — defends against forward-compat drift where the client sends
 * a column the server isn't ready to accept (e.g. `user_id`, `id`).
 */
const CREATE_KEYS = new Set(["input_kind", "input_value", "derived_tags", "selected_exercise_ids"]);

export function validateCreateBreakSession(raw: unknown): ValidationResult<CreateBreakSessionInput> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Body must be a JSON object." };
  }

  for (const key of Object.keys(raw)) {
    if (!CREATE_KEYS.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  if (!isInputKind(raw.input_kind)) {
    return { ok: false, error: "input_kind must be one of: quick_pick, free_text." };
  }

  if (typeof raw.input_value !== "string" || raw.input_value.length === 0) {
    return { ok: false, error: "input_value must be a non-empty string." };
  }
  if (raw.input_value.length > INPUT_VALUE_MAX_LENGTH) {
    return { ok: false, error: `input_value must be ≤ ${INPUT_VALUE_MAX_LENGTH.toString()} characters.` };
  }

  if (!isStringArray(raw.derived_tags)) {
    return { ok: false, error: "derived_tags must be an array of strings." };
  }

  if (!isStringArray(raw.selected_exercise_ids)) {
    return { ok: false, error: "selected_exercise_ids must be an array of strings." };
  }
  if (raw.selected_exercise_ids.length < 1 || raw.selected_exercise_ids.length > 3) {
    return { ok: false, error: "selected_exercise_ids must contain between 1 and 3 ids." };
  }

  return {
    ok: true,
    value: {
      input_kind: raw.input_kind,
      input_value: raw.input_value,
      derived_tags: raw.derived_tags,
      selected_exercise_ids: raw.selected_exercise_ids,
    },
  };
}

const UPDATE_KEYS = new Set(["note", "ended_at", "completed_count", "skipped_count"]);

export function validateUpdateBreakSession(raw: unknown): ValidationResult<UpdateBreakSessionInput> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Body must be a JSON object." };
  }

  for (const key of Object.keys(raw)) {
    if (!UPDATE_KEYS.has(key)) {
      return { ok: false, error: `Field not editable via PATCH: ${key}` };
    }
  }

  const out: UpdateBreakSessionInput = {};

  if ("note" in raw) {
    if (raw.note !== null && typeof raw.note !== "string") {
      return { ok: false, error: "note must be a string or null." };
    }
    if (typeof raw.note === "string" && raw.note.length > NOTE_MAX_LENGTH) {
      return { ok: false, error: `note must be ≤ ${NOTE_MAX_LENGTH.toString()} characters.` };
    }
    out.note = raw.note;
  }

  if ("ended_at" in raw) {
    if (raw.ended_at !== null && !isIsoTimestamp(raw.ended_at)) {
      return { ok: false, error: "ended_at must be an ISO timestamp or null." };
    }
    out.ended_at = raw.ended_at;
  }

  if ("completed_count" in raw) {
    if (typeof raw.completed_count !== "number" || !Number.isInteger(raw.completed_count) || raw.completed_count < 0) {
      return { ok: false, error: "completed_count must be a non-negative integer." };
    }
    out.completed_count = raw.completed_count;
  }

  if ("skipped_count" in raw) {
    if (typeof raw.skipped_count !== "number" || !Number.isInteger(raw.skipped_count) || raw.skipped_count < 0) {
      return { ok: false, error: "skipped_count must be a non-negative integer." };
    }
    out.skipped_count = raw.skipped_count;
  }

  if (Object.keys(out).length === 0) {
    return { ok: false, error: "PATCH body must contain at least one editable field." };
  }

  return { ok: true, value: out };
}
