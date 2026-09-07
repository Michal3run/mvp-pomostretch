import { test, expect, request } from "@playwright/test";
import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import crypto from "node:crypto";

/**
 * Helper: sign up + sign in a new user via browser (page-based form).
 *
 * Using `page.goto` + form fill avoids 403 from Supabase's hosted GoTrue
 * which blocks raw `APIRequestContext.post()` signups (rate-limit / captcha
 * on GitHub Actions runner IPs).
 *
 * After signin we extract cookies from the browser context and create a
 * standalone APIRequestContext seeded with those cookies for API testing.
 */
async function createAuthenticatedContext(
  browser: BrowserContext,
  baseURL: string,
  email: string,
  password: string,
): Promise<{ api: APIRequestContext; page: Page }> {
  const page = await browser.newPage();

  // --- Signup via real browser form ---
  await page.goto("/auth/signup");
  await expect(page.locator("form")).toBeVisible();
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');

  // After signup Supabase redirects to confirm-email, signin, or dashboard
  await expect(page).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/, {
    timeout: 15_000,
  });

  // --- Signin (if not already on dashboard) ---
  if (!page.url().includes("/dashboard")) {
    await page.goto("/auth/signin");
    await expect(page.locator("form")).toBeVisible();
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  // --- Extract cookies from browser and create APIRequestContext ---
  const cookies = await browser.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const api = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      Cookie: cookieHeader,
    },
  });

  return { api, page };
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

  let apiA: APIRequestContext;
  let apiB: APIRequestContext;
  let pageA: Page;
  let pageB: Page;
  let userASessionId: string;

  const baseURL = "http://127.0.0.1:4321";

  test.afterAll(async () => {
    await apiA?.dispose();
    await apiB?.dispose();
    await pageA?.close();
    await pageB?.close();
  });

  test("User A: signup, signin, and create a break session", async ({ context }) => {
    const result = await createAuthenticatedContext(context, baseURL, userAEmail, sharedPassword);
    apiA = result.api;
    pageA = result.page;

    const createRes = await apiA.post("/api/session-history", {
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
    const res = await apiA.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.map((s) => s.id)).toContain(userASessionId);
  });

  test("User B: signup and signin", async ({ browser }) => {
    // Create a fresh browser context for User B (separate cookie jar)
    const ctxB = await browser.newContext({ baseURL });
    const result = await createAuthenticatedContext(ctxB, baseURL, userBEmail, sharedPassword);
    apiB = result.api;
    pageB = result.page;

    // Sanity: User B is authenticated (200, not 401)
    const res = await apiB.get("/api/session-history");
    expect(res.status()).toBe(200);
  });

  test("User B sees an empty session list (cannot see User A's data)", async () => {
    const res = await apiB.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data).toHaveLength(0);
  });

  test("User B cannot delete User A's session (404 via RLS)", async () => {
    const res = await apiB.delete(`/api/session-history/${userASessionId}`);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Not Found");
  });
});
