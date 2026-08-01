import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  
  const quickPick = form.get("quickPick") as string | null;
  const freeText = form.get("freeText") as string | null;
  
  if (!quickPick && !freeText) {
    return context.redirect("/break-input?error=Wybierz opcję lub wpisz własną");
  }

  let kind: "quick-pick" | "free-text" = "quick-pick";
  let value = "";
  let tags: string[] = [];
  
  if (quickPick) {
    kind = "quick-pick";
    value = quickPick;
    
    const textLower = value.toLowerCase();
    if (textLower.includes("oczy")) tags.push("oczy");
    if (textLower.includes("kark")) tags.push("kark");
    if (textLower.includes("ogólne") || textLower.includes("zaskocz")) tags.push("ogólne");
  } else if (freeText) {
    kind = "free-text";
    value = freeText;
    
    const textLower = value.toLowerCase();
    if (textLower.includes("oczy")) tags.push("oczy");
    if (textLower.includes("kark")) tags.push("kark");
    if (textLower.includes("ogólne") || textLower.includes("zaskocz")) tags.push("ogólne");
  }
  
  const cookieValue = JSON.stringify({ kind, value, tags });
  
  context.cookies.set("pomostretch.break_input", cookieValue, {
    path: "/",
    maxAge: 5 * 60,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  
  return context.redirect("/exercise-sequence");
};
