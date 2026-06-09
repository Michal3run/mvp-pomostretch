import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

/**
 * Routes that require an authenticated user. Unauthenticated requests to
 * any of these are redirected to /auth/signin (HTML pages) or rejected with
 * a 401 JSON response (API routes).
 *
 * NOTE: API routes also enforce auth on their own (see src/pages/api/sessions/*),
 * so the middleware check is defense-in-depth rather than the only gate.
 */
const PROTECTED_PAGES = ["/dashboard", "/history"];
const PROTECTED_API = ["/api/sessions"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  const { pathname } = context.url;

  if (PROTECTED_PAGES.some((route) => pathname.startsWith(route))) {
    if (!context.locals.user) {
      return context.redirect("/auth/signin");
    }
  }

  if (PROTECTED_API.some((route) => pathname.startsWith(route))) {
    if (!context.locals.user) {
      return new Response(JSON.stringify({ error: "Unauthenticated." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return next();
});
