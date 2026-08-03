import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

export function createClient(requestHeaders: Headers, cookies: AstroCookies) {
  // astro:env/server is the primary source. In Node.js dev/CI mode, fall back to
  // process.env in case the Vite virtual module hasn't resolved the values yet.
  // The typeof guard is required: process is undefined in Cloudflare Workers runtime.
  const nodeEnv: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {};
  const url = (SUPABASE_URL ?? nodeEnv.SUPABASE_URL ?? "").trim().replace(/^"|"$/g, "");
  const key = (SUPABASE_KEY ?? nodeEnv.SUPABASE_KEY ?? "").trim().replace(/^"|"$/g, "");

  if (!url || !key) {
    return null;
  }
  try {
    new URL(url);
  } catch {
    return null;
  }
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(requestHeaders.get("Cookie") ?? "").map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
