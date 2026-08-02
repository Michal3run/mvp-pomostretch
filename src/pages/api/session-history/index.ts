import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const createSessionSchema = z.object({
  input_kind: z.enum(["quick_pick", "free_text"]).optional().default("quick_pick"),
  input_value: z.string().min(1).max(500),
  derived_tags: z.array(z.string()).min(1).optional().default(["general"]),
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  selected_exercise_ids: z.array(z.string().uuid()).min(1).max(3),
  completed_count: z.number().int().min(0).optional().default(0),
  skipped_count: z.number().int().min(0).optional().default(0),
  ended_at: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const GET: APIRoute = async (context) => {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const supabase = context.locals.supabase;

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const { data, error } = await supabase.from("break_session").select("*").order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const POST: APIRoute = async (context) => {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const parseResult = createSessionSchema.safeParse(requestBody);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: parseResult.error.issues }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const supabase = context.locals.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const sessionPayload = {
    ...parseResult.data,
    user_id: context.locals.user.id,
  };

  const { data, error } = (await supabase.from("break_session").insert(sessionPayload).select().single()) as {
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
