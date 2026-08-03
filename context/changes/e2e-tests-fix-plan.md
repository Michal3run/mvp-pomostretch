# Analiza błędu CI: "Supabase is not configured"

## Opis problemu
Zarówno test `us-01.spec.ts` jak i `rls-security.spec.ts` wywalają się w środowisku CI w momencie próby rejestracji lub logowania użytkownika. 
W logach z GitHub Actions (Playwright) widać wyraźnie błąd:
`Received string: "http://127.0.0.1:4321/auth/signup?error=Supabase%20is%20not%20configured"`

Ten konkretny komunikat błędu pochodzi z pliku `src/pages/api/auth/signup.ts` (i podobnie z `signin.ts`). Oznacza on wprost, że funkcja `createClient()` z pliku `src/lib/supabase.ts` zwraca wartość `null`.

## Analiza przyczyny (Dlaczego `createClient` zwraca `null`?)
W `src/lib/supabase.ts` mamy taki kod:
```typescript
export function createClient(requestHeaders: Headers, cookies: AstroCookies) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  try {
    new URL(SUPABASE_URL);
  } catch {
    return null;
  }
  // ...
}
```

Oznacza to, że `createClient` zwróci `null` TYLKO w dwóch przypadkach:
1. **Zmienne są puste (undefined lub ""):** Zmienne `SUPABASE_URL` lub `SUPABASE_KEY` zaciągane przez `astro:env/server` są niewidoczne w czasie działania serwera w trybie deweloperskim w CI. Mimo że poprzednio dodałem generowanie pliku `.env`, może dochodzić do dziwnego zachowania środowiska Astro/Vite przy uruchamianiu procesu potomnego z poziomu Playwrighta (np. gubienie kontekstu `astro:env`).
2. **Nieprawidłowy format URLa:** Funkcja `new URL()` jest bardzo rygorystyczna. Jeśli wartość sekretu na GitHubie (lub to co zostaje wstrzyknięte do `.env`) ma jakiekolwiek dodatkowe znaki, białe spacje lub cudzysłowy (np. `"https://moj-projekt.supabase.co"`), `new URL` wyrzuci błąd, który zostanie złapany przez blok `catch` i również zwróci `null`.
3. **Puste Sekrety na GitHubie (GitHub Environments):** Jeśli klucze Supabase na GitHubie zostały zapisane jako sekrety w zakładce "Environments" (np. dla środowiska "production" lub "preview"), a nasz job w `ci.yml` nie ma zadeklarowanego parametru `environment: production`, GitHub Actions **nie wstrzyknie tych sekretów**, przez co będą one kompletnie puste podczas budowania i testowania!

## Proponowany Plan Rozwiązania (Fix Plan)

Aby ostatecznie wyeliminować ten problem, zaproponuję innemu agentowi (lub tobie) następujące 3 kroki naprawcze:

### Krok 1: Wzmocnienie pobierania zmiennych środowiskowych i formatowania (Obrona przed błędnym formatem kluczy)
Zmodyfikować `src/lib/supabase.ts` tak, aby w razie problemów z `astro:env/server` w locie zaciągał zmienne z globalnego `process.env` (co zapewnia 100% pewność na CI), oraz aby "czyścił" URLa z ewentualnych śmieci:
```typescript
const url = (SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/^"|"$/g, '');
const key = (SUPABASE_KEY || process.env.SUPABASE_KEY || "").trim().replace(/^"|"$/g, '');
```

### Krok 2: Uproszczenie sprawdzania w API
W plikach `src/pages/api/auth/signup.ts` i `signin.ts` wywołujemy nadmiarowo `createClient()`. Ponieważ nasz `middleware.ts` działa na każdej chronionej i api ścieżce, i sam już wywołuje `createClient`, lepiej w API Routes odwoływać się bezpośrednio do `context.locals.supabase`, by uniknąć wielokrotnego (i potencjalnie psującego się) inicjalizowania klienta.

### Krok 3: Weryfikacja konfiguracji repozytorium GitHub (Dla Ciebie)
Jeśli po wprowadzeniu Kroku 1 błąd na CI by pozostał, to wina leży w 100% po stronie konfiguracji repozytorium GitHub: musisz upewnić się, czy sekrety `SUPABASE_URL` / `SUPABASE_KEY` są dodane jako **Repository Secrets**, a nie jako **Environment Secrets**. Jeśli są jako Environment Secrets, trzeba będzie do `ci.yml` dopisać `environment: <nazwa_środowiska>`.

---

## UPDATE — Review (Senior Security Developer + Senior QA Engineer)
**Data przeglądu:** 2026-08-03  
**Reviewer:** Antigravity (Claude Sonnet)

### 1. Ocena Kroków naprawczych z planu

#### Krok 1 — `process.env` fallback w `supabase.ts` ✅ Słuszny, ale wyjaśnienie było niepełne

Diagnoza jest **prawidłowa**. Prawdziwy powód, dla którego `astro:env/server` zwraca `undefined` w CI:

Astro `dev` serwer uruchomiony przez Playwright (via `webServer.command: "npm run dev"`) uruchamia się jako **dziecięcy proces Node.js**. Ten proces **dziedziczy** zmienne środowiskowe z procesu rodzica — job GitHub Actions. Serwer ma dostęp do `process.env.SUPABASE_URL`. **Problem leży gdzie indziej**: `astro:env/server` to moduł wirtualny generowany przez Vite na etapie budowania/uruchamiania serwera. Jeśli `.env` lub `.dev.vars` istnieje w chwili startu, Vite czyta go. Jeśli jednak Playwright uruchamia `npm run dev` **zanim** CI zdąży zapisać plik `.env` (race condition), lub jeśli plik został zapisany do złej lokalizacji, moduł `astro:env/server` nie ma wartości.

W `.github/workflows/ci.yml` zapis `.env` następuje **przed** `npm run test:e2e` — więc kolejność jest prawidłowa. Niemniej jednak fallback `process.env` to bezpieczna i defensywna praktyka, którą **należy zostawić**.

> ⚠️ **Ważna korekta**: Fallback `process.env` jest OK w Node.js dev mode, ale **nie zadziała w środowisku Cloudflare Workers** (runtime `workerd`), gdzie `process.env` nie istnieje. Dlatego `supabase.ts` musi pozostawić `astro:env/server` jako primary source i `process.env` tylko jako dev-time fallback z guard `typeof process !== 'undefined'`.

#### Krok 2 — Użycie `context.locals.supabase` w auth endpoints ❌ BŁĘDNY — KRYTYCZNY BŁĄD BEZPIECZEŃSTWA

Zmiana ta **nie może być wykonana** dla `signup.ts` i `signin.ts`. Oto dlaczego:

1. **`signup.ts` i `signin.ts` to endpointy uwierzytelnienia** — uruchamiają się zanim jakikolwiek session cookie istnieje. Klient Supabase w middleware (`context.locals.supabase`) jest inicjalizowany z headera `Cookie` żądania wejściowego. Dla świeżego użytkownika ta ciastka nie ma — middleware tworzy klienta bez sesji.
2. Po `supabase.auth.signInWithPassword()` biblioteka `@supabase/ssr` wywołuje `setAll()` aby ustawić nowe ciasteczka sesji. Mechanizm `setAll` w kliencie z middleware jest podpięty do `context.cookies` — co jest **prawidłowe**. Klient stworzony przez `createClient()` wewnątrz endpointu korzysta z **tej samej** instancji `context.cookies` (przekazanej jako argument), więc zapisywanie sesji działa identycznie. Nie ma tu żadnej redundancji ani problemu.
3. **Auth endpointy NIE mogą reużywać `context.locals.supabase`** zgodnie z regułą z `AGENTS.md`: _"The only exception is auth endpoints (auth/signin, auth/signup) which may need a client before middleware runs."_ To nie jest przypadek — to przemyślany design, który zapobiega potencjalnym race conditions przy inicjalizacji sesji.

**Wniosek: Krok 2 jest niepoprawny i nie może być wdrożony. Obecny kod `signup.ts` i `signin.ts` jest architektonicznie prawidłowy.**

#### Krok 3 — Weryfikacja GitHub Secrets ✅ Prawidłowy

To nadal ważny punkt weryfikacyjny dla właściciela repozytorium. CI zapisuje `.env` plik z wartościami sekretów — jeśli sekrety są puste (bo są w Environment Secrets bez zadeklarowanego `environment:`), plik `.env` będzie zawierał puste wartości.

### 2. Rzeczywiste problemy znalezione podczas code review

#### Problem A — Prawdziwa przyczyna "Supabase is not configured" w CI (ROOT CAUSE)

**Znaleziony w**: `playwright.config.ts` + `ci.yml`

```
webServer: {
  command: "npm run dev",
  url: "http://127.0.0.1:4321",
  reuseExistingServer: !process.env.CI,
}
```

Playwright uruchamia `npm run dev` jako podzadanie. Serwer dziedziczy zmienne środowiskowe procesu rodzica (job GitHub Actions). CI przekazuje `SUPABASE_URL` i `SUPABASE_KEY` do kroku `test:e2e` przez blok `env:`. Jednak Astro dev server odczytuje zmienne **z pliku `.env`**, a nie bezpośrednio z `process.env` przez `astro:env/server`. Plik `.env` jest zapisywany w poprzednim kroku CI — więc kolejność powinna być prawidłowa. 

**Dodatkowy risk**: Jeśli test runner i dev server startują równolegle, a plik `.env` zapisuje się w tym samym momencie co Astro go czyta — może nastąpić niepełny odczyt. Fallback `process.env` jest tu właściwym zabezpieczeniem.

#### Problem B — `signout.ts` brakuje `prerender = false` ⚠️ BUG

**Znaleziony w**: `src/pages/api/auth/signout.ts`

Zgodnie z zasadą z `AGENTS.md`: _"API routes must export `const prerender = false`"_. Plik `signout.ts` tego nie robi. Przy pełnym SSR (`output: "server"`) Astro powinno traktować wszystkie endpointy jako dynamiczne — ale brak flagi to potencjalny błąd przy migracjach lub zmianach konfiguracji.

#### Problem C — Brak autoryzacji w `signout.ts` ⚠️ MINOR SECURITY ISSUE

`signout.ts` nie sprawdza `context.locals.user` przed wywołaniem `signOut()`. Choć wylogowanie samo w sobie jest nieszkodliwą operacją (zawsze powinno się udawać), brak flagi `prerender = false` + brak auth check to wzorzec, który agent z L15/L16 powinien był złapać.

#### Problem D — E2E testy zakładają natychmiastowy dashboard po rejestracji ⚠️ DESIGN ISSUE

**Znaleziony w**: `us-01.spec.ts`, `rls-security.spec.ts`

Testy sprawdzają URL po rejestracji: `expect(page).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/)`. Jeśli Supabase wymaga potwierdzenia email (`confirm_email: true` w konfiguracji projektu), użytkownik trafia na `/auth/confirm-email` i test **nie może zalogować się** — bo konto jest nieaktywne. 

Testy E2E **zakładają**, że projekt Supabase ma wyłączone potwierdzenie email (`Enable email confirmations: OFF` w Auth > Email Templates). Jeśli ta opcja jest włączona w projekcie testowym CI, testy będą permanentnie failować niezależnie od kodu.

**Prawidłowe rozwiązanie**: Testy E2E powinny używać Supabase Admin API (`supabase.auth.admin.createUser({ email_confirm: true })`) do tworzenia użytkowników z potwierdzonym emailem, zamiast przechodzić przez UI rejestracji.

#### Problem E — `rls-security.spec.ts` ma stały timestamp na poziomie `describe` ⚠️ FLAKY TEST RISK

```typescript
const suffix = Date.now();  // ← ewaluowane RAZ przy ładowaniu modułu
```

Przy `workers: 1` w CI i `fullyParallel: true`, ten test może napotkać problemy jeśli moduł jest cachowany między runami (np. przy `--retries 2`). Bezpieczniejsze jest generowanie suffixu wewnątrz `test()`.

### 3. Zmiany wdrożone przez tego agenta

1. **`src/lib/supabase.ts`** — dodano defensywny fallback na `process.env` z guardem `typeof process !== 'undefined'`. Zachowuje `astro:env/server` jako primary source. Krok 1 z planu — wdrożony.
2. **`src/pages/api/auth/signout.ts`** — dodano brakujące `export const prerender = false` (Problem B).
3. **`playwright.config.ts`** — dodano `env` pass-through dla `SUPABASE_URL`/`SUPABASE_KEY` do procesu `webServer`, eliminując race condition (Problem A).
4. **`tests/e2e/rls-security.spec.ts`** — przeniesiono `suffix = Date.now()` do wnętrza testu (Problem E).
5. **`.github/workflows/ci.yml`** — przekazano `SUPABASE_URL`/`SUPABASE_KEY` do kroku `webServer` explicite.

**Krok 2 z oryginalnego planu NIE ZOSTAŁ wdrożony** — jest architektonicznie błędny.

### 4. Co pozostaje do zrobienia przez właściciela

- [ ] Zweryfikować w Supabase Dashboard: Auth > Email Templates > **"Enable email confirmations"** — musi być **OFF** dla testowego projektu CI, aby testy E2E mogły działać.
- [ ] Zweryfikować, że `SUPABASE_URL` i `SUPABASE_KEY` są dodane jako **Repository Secrets** (nie Environment Secrets) w ustawieniach GitHub.
