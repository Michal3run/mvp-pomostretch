import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { validateUpdateBreakSession } from "@/lib/sessions/schema";
import type { BreakSession } from "@/lib/sessions/types";

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const unauth = (): Response => json(401, { error: "Unauthenticated." });
const noConfig = (): Response => json(503, { error: "Backend not configured." });
const notFound = (): Response => json(404, { error: "Not found." });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/sessions/:id
 * Fetch one session owned by the caller. Returns 404 (not 403) when the
 * row exists but belongs to another user — we don't want to leak existence.
 * RLS already filters by user_id; we still scope the query as defense-in-depth.
 */
export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauth();

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return noConfig();

  const id = context.params.id;
  if (typeof id !== "string" || !UUID_RE.test(id)) return notFound();

  const { data, error } = await supabase
    .from("break_session")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return notFound();

  return json(200, data as BreakSession);
};

/**
 * PATCH /api/sessions/:id
 * Update the editable subset of a session (note / ended_at / counts) for the
 * caller. The whitelist enforced in `validateUpdateBreakSession` rejects any
 * other field at the route boundary — column-level immutability for
 * `user_id`, `id`, `created_at`, `input_*`, etc. lives here, not in SQL.
 */
export const PATCH: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauth();

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return noConfig();

  const id = context.params.id;
  if (typeof id !== "string" || !UUID_RE.test(id)) return notFound();

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return json(400, { error: "Body must be valid JSON." });
  }

  const validated = validateUpdateBreakSession(raw);
  if (!validated.ok) return json(400, { error: validated.error });

  const { data, error } = await supabase
    .from("break_session")
    .update(validated.value)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return notFound();

  return json(200, data as BreakSession);
};

/**
 * DELETE /api/sessions/:id
 * Hard-delete a session owned by the caller. Returns 204 on success, 404 if
 * the row didn't exist or wasn't owned (existence-not-leaked rule).
 */
export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauth();

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return noConfig();

  const id = context.params.id;
  if (typeof id !== "string" || !UUID_RE.test(id)) return notFound();

  // We need to know whether anything was actually deleted — Supabase's delete
  // doesn't surface row count without `count: "exact"`, but selecting after
  // the delete is the simplest portable shape.
  const { data, error } = await supabase
    .from("break_session")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return notFound();

  return new Response(null, { status: 204 });
};
