import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();

  const quickPick = form.get("quickPick") as string | null;
  const rawFreeText = form.get("freeText") as string | null;
  const trimmedText = rawFreeText?.trim();
  const freeText = trimmedText && trimmedText.length > 0 ? trimmedText : null;

  if (!quickPick && !freeText) {
    return context.redirect("/break-input?error=Wybierz opcję lub wpisz własną");
  }

  let kind: "quick-pick" | "free-text" = "quick-pick";
  let value = "";
  const tagSet = new Set<string>();

  const textToAnalyze = quickPick ?? freeText ?? "";
  if (quickPick) {
    kind = "quick-pick";
    value = quickPick;
  } else if (freeText) {
    kind = "free-text";
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
