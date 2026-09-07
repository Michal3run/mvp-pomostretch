import { test, expect, request } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import crypto from "node:crypto";

/**
 * Helper: sign up + sign in a new user, returning an authenticated APIRequestContext.
 */
async function createAuthenticatedContext(
  baseURL: string,
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL });

  const signupRes = await api.post("/api/auth/signup", {
    form: { email, password, confirmPassword: password },
  });
  expect(signupRes.ok(), `signup succeeded for ${email}`).toBeTruthy();

  const signinRes = await api.post("/api/auth/signin", {
    form: { email, password },
  });
  expect(signinRes.ok(), `signin succeeded for ${email}`).toBeTruthy();

  return api;
}

interface SessionResponse {
  data: { id: string }[] | { id: string };
  error?: string;
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
    await ctxA?.dispose();
    await ctxB?.dispose();
  });

  test("User A: signup, signin, and create a break session", async () => {
    ctxA = await createAuthenticatedContext(baseURL, userAEmail, sharedPassword);

    const exerciseId = crypto.randomUUID();

    const createRes = await ctxA.post("/api/session-history", {
      data: {
        input_kind: "quick_pick",
        input_value: "neck",
        derived_tags: ["neck"],
        selected_exercise_ids: [exerciseId],
        completed_count: 1,
        skipped_count: 0,
        ended_at: new Date().toISOString(),
      },
    });

    expect(createRes.status()).toBe(201);

    const body = (await createRes.json()) as SessionResponse;
    const record = body.data as { id: string };
    expect(record.id).toBeDefined();
    userASessionId = record.id;
  });

  test("User A can read own sessions", async () => {
    const res = await ctxA.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionResponse;
    const sessions = body.data as { id: string }[];
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    const ids = sessions.map((s) => s.id);
    expect(ids).toContain(userASessionId);
  });

  test("User B: signup and signin", async () => {
    ctxB = await createAuthenticatedContext(baseURL, userBEmail, sharedPassword);

    const res = await ctxB.get("/api/session-history");
    expect(res.status()).toBe(200);
  });

  test("User B sees an empty session list (cannot see User A's data)", async () => {
    const res = await ctxB.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionResponse;
    const sessions = body.data as { id: string }[];
    expect(sessions).toHaveLength(0);
  });

  test("User B cannot delete User A's session (404 via RLS)", async () => {
    const res = await ctxB.delete(`/api/session-history/${userASessionId}`);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not Found");
  });
});
