import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const email = ((form.get("email") as string) || "").trim();
  const password = (form.get("password") as string) || "";

  if (!email || !password) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent("Email and password are required")}`);
  }

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent("Supabase is not configured")}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return context.redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`);
  }

  return context.redirect("/dashboard");
};
