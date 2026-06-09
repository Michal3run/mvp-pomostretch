import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";
import { validateCreateBreakSession } from "@/lib/sessions/schema";
import type { BreakSession, ListBreakSessionsResponse } from "@/lib/sessions/types";
import { BREAK_SESSION_LIST_LIMIT } from "@/lib/sessions/types";

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const unauth = (): Response => json(401, { error: "Unauthenticated." });
const noConfig = (): Response => json(503, { error: "Backend not configured." });

/**
 * GET /api/sessions
 * List the signed-in user's break sessions, newest first, capped at
 * BREAK_SESSION_LIST_LIMIT. RLS guarantees rows are user-scoped, but we
 * also filter by `user_id` explicitly as defense-in-depth.
 */
export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauth();

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return noConfig();

  const { data, error } = await supabase
    .from("break_session")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(BREAK_SESSION_LIST_LIMIT);

  if (error) {
    return json(500, { error: error.message });
  }

  const response: ListBreakSessionsResponse = { items: (data ?? []) as BreakSession[] };
  return json(200, response);
};

/**
 * POST /api/sessions
 * Create a new break_session row owned by the signed-in user.
 *
 * The body shape is validated by `validateCreateBreakSession` — unknown
 * fields are rejected (defense against forward-compat drift).
 */
export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return unauth();

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return noConfig();

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return json(400, { error: "Body must be valid JSON." });
  }

  const validated = validateCreateBreakSession(raw);
  if (!validated.ok) {
    return json(400, { error: validated.error });
  }

  const { data, error } = await supabase
    .from("break_session")
    .insert({ ...validated.value, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    return json(500, { error: error.message });
  }

  return json(201, data as BreakSession);
};
