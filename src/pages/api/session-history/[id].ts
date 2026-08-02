import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// eslint-disable-next-line @typescript-eslint/no-deprecated
const idSchema = z.string().uuid();

const updateSchema = z.object({
  note: z.string().max(500).optional().nullable(),
  completed_count: z.number().int().min(0).optional(),
  skipped_count: z.number().int().min(0).optional(),
});

export const DELETE: APIRoute = async (context) => {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const idResult = idSchema.safeParse(context.params.id);
  if (!idResult.success) {
    return new Response(JSON.stringify({ error: "Invalid ID format" }), {
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

  const { data, error } = await supabase.from("break_session").delete().eq("id", idResult.data).select(); // Select is needed to return deleted rows

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // RLS will silently hide rows not belonging to the user.
  // If data is empty, the record didn't exist or didn't belong to the user.
  if (data.length === 0) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ data: (data as unknown[])[0] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const PATCH: APIRoute = async (context) => {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const idResult = idSchema.safeParse(context.params.id);
  if (!idResult.success) {
    return new Response(JSON.stringify({ error: "Invalid ID format" }), {
      status: 400,
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

  const bodyResult = updateSchema.safeParse(requestBody);
  if (!bodyResult.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: bodyResult.error.issues }), {
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

  const updateData = bodyResult.data;

  // Don't run update if no fields are provided
  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const { data, error } = await supabase.from("break_session").update(updateData).eq("id", idResult.data).select(); // Select to return updated rows

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (data.length === 0) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ data: (data as unknown[])[0] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
