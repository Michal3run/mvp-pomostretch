// Covers R-02: User isolation — User B must not be able to read or delete User A's sessions.
// Converted to a pure API integration test to avoid brittle UI tests for DB-level security.
import { test, expect } from "@playwright/test";

test.describe("M8: RLS Security and Isolation (Integration)", () => {
  test("User B cannot see or delete User A's session", async ({ playwright, baseURL }) => {
    const suffix = Date.now();
    const userA = { email: `usera_${suffix}@example.com`, password: "testpassword123" };
    const userB = { email: `userb_${suffix}@example.com`, password: "testpassword123" };
    let sessionAId = "";

    // 1. Create API context for User A
    const reqA = await playwright.request.newContext({ baseURL });

    // Signup & Signin User A
    await reqA.post("/api/auth/signup", {
      data: new URLSearchParams({ email: userA.email, password: userA.password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    await reqA.post("/api/auth/signin", {
      data: new URLSearchParams({ email: userA.email, password: userA.password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // Create session for User A
    const sessionResA = await reqA.post("/api/session-history", {
      data: {
        input_kind: "quick_pick",
        input_value: "Tylko kark",
        derived_tags: ["general"],
        selected_exercise_ids: ["00000000-0000-0000-0000-000000000000"],
        completed_count: 1,
        skipped_count: 0
      }
    });
    
    expect(sessionResA.ok()).toBeTruthy();
    const historyA = await sessionResA.json();
    sessionAId = historyA.data.id;
    expect(sessionAId).toBeTruthy();

    // 2. Create API context for User B
    const reqB = await playwright.request.newContext({ baseURL });

    // Signup & Signin User B
    await reqB.post("/api/auth/signup", {
      data: new URLSearchParams({ email: userB.email, password: userB.password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    await reqB.post("/api/auth/signin", {
      data: new URLSearchParams({ email: userB.email, password: userB.password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // User B should not see User A's session
    const getResB = await reqB.get("/api/session-history");
    expect(getResB.ok()).toBeTruthy();
    const historyB = await getResB.json();
    expect(historyB.data).toHaveLength(0);

    // User B attempting to delete User A's session should receive 404
    const deleteResB = await reqB.delete(`/api/session-history/${sessionAId}`);
    expect(deleteResB.status()).toBe(404);
  });
});
