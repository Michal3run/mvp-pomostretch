// Covers R-05: A break_session row created by user A cannot be read/deleted by user B
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
 *
 * The Origin header is required because Astro's built-in CSRF checkOrigin
 * rejects state-changing requests (POST/DELETE/PATCH) without a matching Origin.
 */
async function createAuthenticatedContext(
  browserCtx: BrowserContext,
  baseURL: string,
  email: string,
  password: string,
): Promise<{ api: APIRequestContext; page: Page }> {
  const page = await browserCtx.newPage();

  // --- Signup via real browser form ---
  await page.goto("/auth/signup");
  await expect(page.locator("form")).toBeVisible();
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/^hasło$|^password$/i).fill(password);
  await page.getByLabel(/potwierdź hasło|^confirm password$/i).fill(password);
  await page.getByRole("button", { name: /Create account|Zarejestruj/i }).click();

  // After signup Supabase redirects to confirm-email, signin, or dashboard.
  // Also handle staying on /auth/signup when the server-side redirect failed
  // (e.g. the signup succeeded but page didn't navigate — we still try signin).
  await page
    .waitForURL((url) => url.pathname !== "/auth/signup", { timeout: 15_000 })
    .catch(() => {
      // If still on signup page, that's okay — we'll try signin next
    });

  // --- Signin (if not already on dashboard) ---
  if (!page.url().includes("/dashboard")) {
    await page.goto("/auth/signin");
    await expect(page.locator("form")).toBeVisible();
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/^hasło$|^password$/i).fill(password);
    await page.getByRole("button", { name: /Sign in|Zaloguj/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  // --- Extract cookies from browser and create APIRequestContext ---
  const cookies = await browserCtx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const api = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      Cookie: cookieHeader,
      // Astro's built-in CSRF (checkOrigin) rejects POST/DELETE/PATCH
      // without a matching Origin header. The standalone APIRequestContext
      // doesn't set this automatically like a browser would.
      Origin: baseURL,
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
  let userAEmail: string;
  let userBEmail: string;
  const sharedPassword = "TestPassword123!";

  let apiA: APIRequestContext | undefined;
  let apiB: APIRequestContext | undefined;
  let pageA: Page | undefined;
  let pageB: Page | undefined;
  let browserCtxB: BrowserContext | undefined;
  let userASessionId: string | undefined;

  const baseURL = "http://127.0.0.1:4321";

  test.beforeAll(() => {
    const suffix = Date.now();
    userAEmail = `rls_a_${suffix}@example.com`;
    userBEmail = `rls_b_${suffix}@example.com`;
  });

  test.afterAll(async () => {
    await apiA?.dispose();
    await apiB?.dispose();
    await pageA?.close();
    await pageB?.close();
    await browserCtxB?.close();
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
    if (!apiA || !userASessionId) throw new Error("Test dependencies not initialized");
    const res = await apiA.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.map((s) => s.id)).toContain(userASessionId);
  });

  test("User B: signup and signin", async ({ browser }) => {
    // Create a fresh browser context for User B (separate cookie jar)
    browserCtxB = await browser.newContext({ baseURL });
    const result = await createAuthenticatedContext(browserCtxB, baseURL, userBEmail, sharedPassword);
    apiB = result.api;
    pageB = result.page;

    // Sanity: User B is authenticated (200, not 401)
    const res = await apiB.get("/api/session-history");
    expect(res.status()).toBe(200);
  });

  test("User B sees an empty session list (cannot see User A's data)", async () => {
    if (!apiB) throw new Error("apiB not initialized");
    const res = await apiB.get("/api/session-history");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as SessionListResponse;
    expect(body.data).toHaveLength(0);
  });

  test("User B cannot delete User A's session (404 via RLS)", async () => {
    if (!apiB || !userASessionId) throw new Error("Test dependencies not initialized");
    const res = await apiB.delete(`/api/session-history/${userASessionId}`);
    expect(res.status()).toBe(404);

    const body = (await res.json()) as ErrorResponse;
    expect(body.error).toBe("Not Found");
  });
});
