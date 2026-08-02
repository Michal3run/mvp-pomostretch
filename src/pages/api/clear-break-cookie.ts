import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = (context) => {
  context.cookies.delete("pomostretch.break_input", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
