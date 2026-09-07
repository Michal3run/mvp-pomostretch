import { test, expect, request } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import crypto from "node:crypto";

/**
 * Helper: sign up + sign in a new user via form-based endpoints.
 *
 * Both /api/auth/signup and /api/auth/signin return 302 redirects.
 * We use maxRedirects: 0 so we get the raw 302 (not the HTML page).
 * Supabase auth cookies are set on the 302 response itself, so the
 * APIRequestContext captures them without needing to follow the redirect.
 */
async function createAuthenticatedContext(
  baseURL: string,
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL });

  // Signup — expect 302 redirect (to /auth/confirm-email on success, /auth/signup?error= on failure)
  const signupRes = await api.post("/api/auth/signup", {
    form: { email, password, confirmPassword: password },
    maxRedirects: 0,
  });
  expect(signupRes.status(), `signup for ${email}: expected 302`).toBe(302);
  expect(
    signupRes.headers()["location"],
    "signup should not redirect to error",
  ).not.toContain("error");

  // Signin — expect 302 redirect to /dashboard on success
  const signinRes = await api.post("/api/auth/signin", {
    form: { email, password },
    maxRedirects: 0,
  });
  expect(signinRes.status(), `signin for ${email}: expected 302`).toBe(302);
  expect(
    signinRes.headers()["location"],
    "signin should redirect to /dashboard",
  ).toContain("/dashboard");

  return api;
}

interface SessionRecord {
  id: string;
}

interface SessionListResponse {
  data: SessionRecord[];
}

interface SessionCreateResponse {
  data: SessionRecord;
}

interface ErrorResponse {
  error: string;
}

test.describe.serial("RLS: Multi-tenant session isolation", () => {
  const suffix = Date.now();
  const userAEmail = `rls_a_${suffix}@example.com`;
  const userBEmail = `rls_b_${suffix}@example.com`;
  const sharedPassword = "TestPassword123!";

  let ctxA: APIRequestContext;
  let ctxB: APIRequestContext;
  let userASessionId: string;

  const baseURL = "http://127.0.0.1:4321";

  test.afterAll(async () => {
    await ctxA.dispose();
    await ctxB.dispose();
  });

  test("User A: signup, signin, and create a break session", async () => {
    ctxA = await createAuthenticatedContext(baseURL, userAEmail, sharedPassword);

    const createRes = await ctxA.post("/api/session-history", {
      data: {
        input_kind: "quick_pick",
        input_value: "neck",
        derived_tags: ["neck"],
        selected_exercise_ids: [crypto.randomUUID()],
        completed_count: 1,
        skipped_count: 0,
        ended_at: new Date().toISOString(),
      },
    });

    expect(createRes.status()).toBe(201);
    const body = (await createRes.json()) as SessionCreateResponse;
    expect(body.data.id).toBeDefined();
    userASessionId = body.data.id;
  });

  test("User A can read own sessions", async () => {
    const res = await ctxA.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.map((s) => s.id)).toContain(userASessionId);
  });

  test("User B: signup and signin", async () => {
    ctxB = await createAuthenticatedContext(baseURL, userBEmail, sharedPassword);

    // Sanity: User B is authenticated (200, not 401)
    const res = await ctxB.get("/api/session-history");
    expect(res.status()).toBe(200);
  });

  test("User B sees an empty session list (cannot see User A's data)", async () => {
    const res = await ctxB.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data).toHaveLength(0);
  });

  test("User B cannot delete User A's session (404 via RLS)", async () => {
    const res = await ctxB.delete(`/api/session-history/${userASessionId}`);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Not Found");
  });
});
