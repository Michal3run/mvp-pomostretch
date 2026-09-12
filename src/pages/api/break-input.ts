import type { APIRoute } from "astro";

export const prerender = false;

import { z } from "zod";
import { parseBreakInputTags } from "@/lib/break-input-parser";

const formSchema = z
  .object({
    quickPick: z.string().nullable().optional(),
    freeText: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const qp = data.quickPick?.trim();
      const ft = data.freeText?.trim();
      return Boolean(qp?.length) || Boolean(ft?.length);
    },
    {
      message: "Wybierz opcję lub wpisz własną",
    },
  );

export const POST: APIRoute = async (context) => {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const form = await context.request.formData();

  const parseResult = formSchema.safeParse({
    quickPick: form.get("quickPick"),
    freeText: form.get("freeText"),
  });

  if (!parseResult.success) {
    return context.redirect(`/break-input?error=${encodeURIComponent(parseResult.error.issues[0].message)}`);
  }

  const rawQuickPick = parseResult.data.quickPick;
  const trimmedQuickPick = rawQuickPick?.trim();
  const quickPick = trimmedQuickPick && trimmedQuickPick.length > 0 ? trimmedQuickPick : null;
  const rawFreeText = parseResult.data.freeText;
  const trimmedText = rawFreeText?.trim();
  const freeText = trimmedText && trimmedText.length > 0 ? trimmedText : null;

  let kind: "quick_pick" | "free_text" = "quick_pick";
  let value = "";

  const textToAnalyze = quickPick ?? freeText ?? "";
  if (quickPick) {
    kind = "quick_pick";
    value = quickPick;
  } else if (freeText) {
    kind = "free_text";
    value = freeText;
  }

  const tags = parseBreakInputTags(textToAnalyze);

  const cookieValue = JSON.stringify({ kind, value, tags });

  context.cookies.set("pomostretch.break_input", cookieValue, {
    path: "/",
    maxAge: 30 * 60,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
  });

  return context.redirect("/exercise-sequence");
};
