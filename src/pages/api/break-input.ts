import type { APIRoute } from "astro";

export const prerender = false;

import { z } from "zod";

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
    return context.redirect("/auth/signin");
  }

  const form = await context.request.formData();

  const parseResult = formSchema.safeParse({
    quickPick: form.get("quickPick"),
    freeText: form.get("freeText"),
  });

  if (!parseResult.success) {
    return context.redirect(`/break-input?error=${encodeURIComponent(parseResult.error.issues[0].message)}`);
  }

  const quickPick = parseResult.data.quickPick;
  const rawFreeText = parseResult.data.freeText;
  const trimmedText = rawFreeText?.trim();
  const freeText = trimmedText && trimmedText.length > 0 ? trimmedText : null;

  let kind: "quick_pick" | "free_text" = "quick_pick";
  let value = "";
  const tagSet = new Set<string>();

  const textToAnalyze = quickPick ?? freeText ?? "";
  if (quickPick) {
    kind = "quick_pick";
    value = quickPick;
  } else if (freeText) {
    kind = "free_text";
    value = freeText;
  }

  const textLower = textToAnalyze.toLowerCase();

  // Map Polish and English keywords to database body_areas ('eyes', 'neck', 'shoulders', 'lower_back', 'general')
  if (
    textLower.includes("oczy") ||
    textLower.includes("ocz") ||
    textLower.includes("wzrok") ||
    textLower.includes("eye")
  ) {
    tagSet.add("eyes");
  }
  if (textLower.includes("kark") || textLower.includes("szyj") || textLower.includes("neck")) {
    tagSet.add("neck");
  }
  if (textLower.includes("bark") || textLower.includes("ramion") || textLower.includes("shoulder")) {
    tagSet.add("shoulders");
  }
  if (
    textLower.includes("plecy") ||
    textLower.includes("lędźw") ||
    textLower.includes("kręgosłup") ||
    textLower.includes("back")
  ) {
    tagSet.add("lower_back");
  }
  if (
    textLower.includes("ogóln") ||
    textLower.includes("zaskocz") ||
    textLower.includes("wszystko") ||
    textLower.includes("general")
  ) {
    tagSet.add("general");
  }

  let tags = Array.from(tagSet);

  // FR-012: Fallback to "general" tag if no known keywords matched
  if (tags.length === 0) {
    tags = ["general"];
  }

  const cookieValue = JSON.stringify({ kind, value, tags });

  context.cookies.set("pomostretch.break_input", cookieValue, {
    path: "/",
    maxAge: 5 * 60,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
  });

  return context.redirect("/exercise-sequence");
};
