# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rls-security.spec.ts >> M8: RLS Security and Isolation >> User B cannot see or delete User A's session
- Location: tests\e2e\rls-security.spec.ts:21:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/auth\/(confirm-email|signin|dashboard)/
Received string:  "http://127.0.0.1:4321/auth/signup?error=Supabase%20is%20not%20configured"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" data-astro-cid-sckkx6r4="">…</html>
       - unexpected value "http://127.0.0.1:4321/auth/signup?error=Supabase%20is%20not%20configured"

```

```yaml
- alert:
  - strong: "Uwaga:"
  - text: Supabase nie jest skonfigurowany — funkcje uwierzytelniania są wyłączone.
  - link "Zobacz instrukcję konfiguracji":
    - /url: https://github.com/przeprogramowani/10x-astro-starter#supabase-configuration
  - text: .
- heading "Sign up" [level=1]
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: Min. 6 characters
- button "Show password"
- text: Confirm password
- textbox "Confirm password":
  - /placeholder: Re-enter your password
- button "Show password"
- paragraph: Supabase is not configured
- button "Create account"
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /auth/signin
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | interface SessionHistoryItem {
  4   |   id: string;
  5   |   user_id: string;
  6   |   break_type: string;
  7   |   created_at: string;
  8   | }
  9   | 
  10  | interface ApiResponse<T> {
  11  |   data: T;
  12  |   error?: string;
  13  | }
  14  | 
  15  | test.describe("M8: RLS Security and Isolation", () => {
  16  |   const suffix = Date.now();
  17  |   const userA = { email: `usera_${suffix}@example.com`, password: "testpassword123" };
  18  |   const userB = { email: `userb_${suffix}@example.com`, password: "testpassword123" };
  19  |   let sessionAId = "";
  20  | 
  21  |   test("User B cannot see or delete User A's session", async ({ browser }) => {
  22  |     // 1. Tworzymy osobny kontekst dla Użytkownika A
  23  |     const contextA = await browser.newContext();
  24  |     const pageA = await contextA.newPage();
  25  | 
  26  |     await pageA.goto("/auth/signup");
  27  |     await pageA.fill('input[name="email"]', userA.email);
  28  |     await pageA.fill('input[name="password"]', userA.password);
  29  |     await pageA.click('button[type="submit"]');
  30  | 
> 31  |     await expect(pageA).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/);
      |                         ^ Error: expect(page).toHaveURL(expected) failed
  32  | 
  33  |     if (!pageA.url().includes("/dashboard")) {
  34  |       await pageA.goto("/auth/signin");
  35  |       await pageA.fill('input[name="email"]', userA.email);
  36  |       await pageA.fill('input[name="password"]', userA.password);
  37  |       await pageA.click('button[type="submit"]');
  38  |     }
  39  | 
  40  |     await expect(pageA.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });
  41  | 
  42  |     // Utworzenie sesji dla Użytkownika A
  43  |     await pageA.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
  44  |     await expect(pageA.getByText("Czas skupienia")).toBeVisible();
  45  | 
  46  |     await pageA.getByRole("button", { name: "Zakończ" }).click();
  47  |     await expect(pageA.getByText("Czas na przerwę!")).toBeVisible();
  48  | 
  49  |     await pageA.getByRole("button", { name: "Tylko kark" }).click();
  50  |     await expect(pageA.getByRole("button", { name: "Zrobione" }).first()).toBeVisible({ timeout: 10000 });
  51  | 
  52  |     for (let i = 0; i < 20; i++) {
  53  |       if (!(await pageA.getByRole("button", { name: "Zrobione" }).first().isVisible())) break;
  54  |       await pageA.getByRole("button", { name: "Zrobione" }).first().click();
  55  |       await pageA.waitForTimeout(300);
  56  |     }
  57  | 
  58  |     await expect(pageA.getByText("Świetna robota!")).toBeVisible();
  59  | 
  60  |     // Pobieramy ID sesji przez pageA.request (uwzględnia ciasteczka zalogowanego pageA)
  61  |     const historyResA = await pageA.request.get("/api/session-history");
  62  |     expect(historyResA.ok()).toBeTruthy();
  63  |     const historyA = (await historyResA.json()) as ApiResponse<SessionHistoryItem[]>;
  64  | 
  65  |     expect(historyA.data.length).toBeGreaterThan(0);
  66  |     sessionAId = historyA.data[0].id;
  67  |     expect(sessionAId).toBeTruthy();
  68  | 
  69  |     // 2. Tworzymy całkowicie odrębny kontekst dla Użytkownika B
  70  |     const contextB = await browser.newContext();
  71  |     const pageB = await contextB.newPage();
  72  | 
  73  |     await pageB.goto("/auth/signup");
  74  |     await pageB.fill('input[name="email"]', userB.email);
  75  |     await pageB.fill('input[name="password"]', userB.password);
  76  |     await pageB.click('button[type="submit"]');
  77  | 
  78  |     await expect(pageB).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/);
  79  | 
  80  |     if (!pageB.url().includes("/dashboard")) {
  81  |       await pageB.goto("/auth/signin");
  82  |       await pageB.fill('input[name="email"]', userB.email);
  83  |       await pageB.fill('input[name="password"]', userB.password);
  84  |       await pageB.click('button[type="submit"]');
  85  |     }
  86  | 
  87  |     await expect(pageB.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });
  88  | 
  89  |     // Weryfikacja UI/API dla Użytkownika B
  90  |     const historyResB = await pageB.request.get("/api/session-history");
  91  |     expect(historyResB.ok()).toBeTruthy();
  92  |     const historyB = (await historyResB.json()) as ApiResponse<SessionHistoryItem[]>;
  93  | 
  94  |     // Użytkownik B nie powinien widzieć sesji Użytkownika A
  95  |     expect(historyB.data).toHaveLength(0);
  96  | 
  97  |     // Próba usunięcia sesji Użytkownika A przez Użytkownika B (oczekiwane 404 z uwagi na RLS)
  98  |     const deleteAttempt = await pageB.request.delete(`/api/session-history/${sessionAId}`);
  99  |     expect(deleteAttempt.status()).toBe(404);
  100 | 
  101 |     await contextA.close();
  102 |     await contextB.close();
  103 |   });
  104 | });
  105 | 
```