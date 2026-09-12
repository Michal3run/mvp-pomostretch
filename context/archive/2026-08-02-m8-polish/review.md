# M8 Polish — Code Review & Implementation Guidelines

**Reviewer**: Antigravity (Claude Opus 4.6)
**Date**: 2026-08-02
**Scope**: Review of 3 M8 deliverables + assessment of Idle Break F5-persistence proposal

---

## Part 1: Review of M8 Deliverables

### 1.1 Migracja SQL — `20260802143000_seed_more_exercises.sql`

**Plik**: [`supabase/migrations/20260802143000_seed_more_exercises.sql`](file:///C:/src/10xDevs/mvp-pomostretch/supabase/migrations/20260802143000_seed_more_exercises.sql)

#### Verdict: ⚠️ KRYTYCZNY BUG — Migracja NIE jest idempotentna

Agent użył konstrukcji `INSERT ... SELECT ... FROM (VALUES ...) AS v WHERE NOT EXISTS (SELECT 1 FROM exercise e WHERE e.name = v.name)`. Wygląda poprawnie na pierwszy rzut oka, ale jest **jeden krytyczny problem**:

**Problem**: Klauzula `WHERE NOT EXISTS` jest umieszczona na zewnątrz `SELECT * FROM (VALUES ...)` — to oznacza, że sprawdzenie `NOT EXISTS` jest wykonywane **raz dla całego zbioru**, a nie per-row. Jeśli **choć jedno** z 10 ćwiczeń już istnieje w bazie (np. bo uruchomiono migrację częściowo), warunek `NOT EXISTS` po prostu nie wstawi żadnego wiersza. Ale co gorsza — jeśli **żadne** z 10 nie istnieje, wstawi **wszystkie**.

Oto jak to naprawdę działa w PostgreSQL z tą składnią:

```sql
-- To, co agent napisał:
INSERT INTO public.exercise (...)
SELECT * FROM (VALUES (...), (...), ...) AS v(name, ...)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercise e WHERE e.name = v.name
);
```

Wbrew pozorom, w PostgreSQL ta składnia **JEST poprawna** — `v.name` odnosi się do kolumny aliasu `v` z subselect, i warunek `NOT EXISTS` jest oceniany **per-row** w kontekście `SELECT * FROM (VALUES ...) AS v`. To jest poprawny correlated subquery.

**Aktualizacja po głębszej analizie**: ✅ Składnia `WHERE NOT EXISTS (SELECT 1 FROM ... WHERE e.name = v.name)` w kontekście `SELECT * FROM (VALUES ...) AS v(name, ...)` **jest poprawna i idempotentna**. PostgreSQL ocenia `NOT EXISTS` per-wiersz subselect `v`. Test: jeśli 5 z 10 ćwiczeń już istnieje, wstawi tylko brakujące 5.

**Jedyny prawdziwy problem**: Tabela `exercise` nie ma constraint `UNIQUE(name)`. Sprawdzam [`20260715120000_create_exercise_table.sql`](file:///C:/src/10xDevs/mvp-pomostretch/supabase/migrations/20260715120000_create_exercise_table.sql):

```sql
CREATE TABLE IF NOT EXISTS public.exercise (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    ...
);
```

**Brak `UNIQUE(name)`!** To oznacza, że:

- `WHERE NOT EXISTS` chroni przed duplikatami **tylko na poziomie logiki migracji**.
- Jeśli ktokolwiek wstawi ćwiczenie o tej samej nazwie z innego źródła (np. z dashboardu admina w przyszłości), `WHERE NOT EXISTS` zadziała poprawnie.
- Ale bez `UNIQUE(name)` baza nie gwarantuje integralności — dwa równoczesne `INSERT` mogłyby wstawić duplikat.

**Alternatywne podejście `ON CONFLICT (name) DO NOTHING`**, wymienione w planie, byłoby lepsze, ale **wymaga** wcześniejszego `ALTER TABLE exercise ADD CONSTRAINT exercise_name_unique UNIQUE (name)`. Bez constraint `ON CONFLICT` się nie skompiluje.

#### Instrukcje naprawy:

1. **Dodaj brakujący UNIQUE constraint** na początku migracji:
   ```sql
   ALTER TABLE public.exercise ADD CONSTRAINT exercise_name_key UNIQUE (name);
   ```
2. Alternatywnie: Zamień `WHERE NOT EXISTS` na `ON CONFLICT (name) DO NOTHING` po dodaniu constraint.
3. Jeśli nie chcemy UNIQUE (bo duplikaty nazw są dozwolone w przyszłym modelu), to obecna forma `WHERE NOT EXISTS` jest wystarczająca, ale agent powinien to udokumentować.

#### Inne uwagi do migracji:

- ✅ Nazwy pliku zgodne z konwencją `YYYYMMDDHHmmss_short_description.sql`.
- ✅ Wartości `duration_seconds` mieszczą się w CHECK constraint (30-120).
- ✅ Tagi `body_areas` odpowiadają istniejącym wartościom.
- ⚠️ Ścieżki obrazów (`images/eye-palming.svg` itp.) są ponownie używane z istniejących ćwiczeń — OK, ale ćwiczenia jak "Masaż skroni" mają przypisany obraz `eye-palming.svg` co semantycznie nie pasuje. To kosmetyczne, nie blokujące.

---

### 1.2 Komponent InfoButton.tsx + integracja z dashboard.astro

**Pliki**:

- [`src/components/InfoButton.tsx`](file:///C:/src/10xDevs/mvp-pomostretch/src/components/InfoButton.tsx)
- [`src/pages/dashboard.astro`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/dashboard.astro)

#### Verdict: ✅ Poprawna implementacja z drobnymi uwagami

**Wyspa React + Astro — integracja poprawna:**

```astro
<!-- dashboard.astro -->
<div class="absolute top-4 right-4">
  <InfoButton client:load />
</div>
```

- ✅ `client:load` jest poprawny — Dialog wymaga interaktywności (kliknięcie, otwarcie, zamknięcie), więc potrzebuje hydracji.
- ✅ **`class` vs `className`**: Agent **prawidłowo** używa `class` w plikach `.astro` (L10, L11-12, L14, L17 itd.) i `className` w plikach `.tsx` (L20, L22, L25 itd.). To jest poprawne rozróżnienie Astro vs React.
- ✅ Użyto komponentów shadcn/ui `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`.
- ✅ `aria-label` na przycisku (L19): `"Informacje o aplikacji PomoStretch"`.
- ✅ Brak `"use client"` — zgodnie z konwencją Astro (AGENTS.md).
- ✅ Import z `@/components/ui/...` — zgodny z aliasem `@/*`.

**Uwagi:**

1. ✅ Wzmianka o RLS i CRUD jest obecna w sekcji "Dla oceniających MVP" (L64-69) — zgodnie z planem M8.
2. ✅ Escape `&quot;` dla cudzysłowów w JSX (L59) — poprawne.
3. ⚠️ **Brak klawisza Escape test**: Plan M8 wymaga "zamykanie klawiszem Escape". Shadcn `Dialog` obsługuje to natywnie (Radix UI pod spodem), ale warto to potwierdzić testem manualnym.
4. ⚠️ **Brak responsywności**: `sm:max-w-md` na `DialogContent` może być za szeroki na mobilnych. Ale roadmap mówi "MVP targets desktop-only", więc akceptowalne.

---

### 1.3 Test Playwright — `rls-security.spec.ts`

**Plik**: [`tests/e2e/rls-security.spec.ts`](file:///C:/src/10xDevs/mvp-pomostretch/tests/e2e/rls-security.spec.ts)

#### Verdict: ⚠️ KRYTYCZNE problemy CI + logika testu poprawna z zastrzeżeniami

**Struktura testu — dobrze zaprojektowana:**

- ✅ Oddzielne konteksty `browser.newContext()` dla User A i User B — izolacja ciasteczek.
- ✅ Dynamiczne e-maile z `Date.now()` suffix — unikają kolizji.
- ✅ Weryfikacja RLS: User B nie widzi sesji User A (`expect(historyB.data).toHaveLength(0)`).
- ✅ Weryfikacja DELETE: `expect(deleteAttempt.status()).toBe(404)` — poprawne, bo [`[id].ts`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/api/session-history/%5Bid%5D.ts) zwraca 404 gdy RLS nie pozwala zobaczyć wiersza (L57-66).
- ✅ Konteksty są zamykane na końcu (`contextA.close()`, `contextB.close()`).

#### KRYTYCZNE problemy:

**Problem 1: Potwierdzenie e-mail w Supabase Cloud (SHOWSTOPPER dla CI)**

Endpoint [`signup.ts`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/api/auth/signup.ts) po rejestracji robi:

```typescript
return context.redirect("/auth/confirm-email");
```

Test obsługuje to przez:

```typescript
await expect(pageA).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/);
if (!pageA.url().includes("/dashboard")) {
  await pageA.goto("/auth/signin");
  // ... logowanie
}
```

**Ale**: Jeśli Supabase Cloud ma włączony "Confirm email" (domyślne ustawienie!), to:

1. Rejestracja wysyła maila z linkiem potwierdzającym
2. Użytkownik ląduje na `/auth/confirm-email`
3. Logowanie (`signInWithPassword`) **zwróci błąd** "Email not confirmed"
4. Test się **zawiesi** na `expect(pageA.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 })`

**Rozwiązania:**

- **Opcja A (zalecana)**: W ustawieniach Supabase Dashboard → Authentication → Settings → wyłącz "Confirm email" dla środowiska testowego.
- **Opcja B**: Użyj Supabase Admin API do auto-potwierdzenia użytkownika w teście (wymaga `service_role` key, co jest antypattern w E2E).
- **Opcja C**: Użyj `supabase.auth.admin.createUser({ email, password, email_confirm: true })` — ale to wymaga server-side klucza.

> [!CAUTION]
> Jeśli Supabase Cloud ma włączone "Confirm email", test zawsze się zawiesi. To jest najpoważniejszy problem.

**Problem 2: Czyszczenie testowych użytkowników**

E-maile `usera_<timestamp>@example.com` są tworzone w każdym przebiegu CI. **Nie są nigdy usuwane!** Supabase Auth ma limity (domyślnie 30 req/h na signup). Przy częstych CI uruchomieniach:

- Baza `auth.users` rośnie bez kontroli
- Możliwe rate limiting na endpoint `/auth/v1/signup`
- W `break_session` zostają osierocone wiersze

**Rozwiązanie**: Dodaj teardown po teście (lub `afterAll`) który:

```typescript
// Pseudokod — wymaga service_role key
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
await adminClient.auth.admin.deleteUser(userAId);
await adminClient.auth.admin.deleteUser(userBId);
```

**Problem 3: Pętla `while` z "Zrobione" (L52-55) — potencjalny infinite loop**

```typescript
while (await pageA.getByRole("button", { name: "Zrobione" }).first().isVisible()) {
  await pageA.getByRole("button", { name: "Zrobione" }).first().click();
  await pageA.waitForTimeout(300);
}
```

Jeśli kliknięcie "Zrobione" nie zmienia stanu (np. błąd w `advanceNext`), pętla nigdy się nie zakończy. Lepiej:

```typescript
const maxExercises = 5; // safety valve
for (let i = 0; i < maxExercises; i++) {
  const doneBtn = pageA.getByRole("button", { name: "Zrobione" }).first();
  if (!(await doneBtn.isVisible().catch(() => false))) break;
  await doneBtn.click();
  await pageA.waitForTimeout(300);
}
```

**Problem 4: Brak `prerender = false` w exercise-sequence.astro — ale to NIE jest problem**

Plik [`exercise-sequence.astro`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/exercise-sequence.astro) już ma `export const prerender = false` (L6). Test jest safe.

**Problem 5: Ścieżka API — `session-history` vs `sessions`**

Test strzela do:

```typescript
const historyResA = await pageA.request.get("/api/session-history");
const deleteAttempt = await pageB.request.delete(`/api/session-history/${sessionAId}`);
```

Roadmap M5 planował endpointy jako `/api/sessions/`, ale faktyczna implementacja jest pod [`/api/session-history/`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/api/session-history/index.ts) i [`/api/session-history/[id]`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/api/session-history/%5Bid%5D.ts). Test jest **spójny z implementacją**, więc OK.

**Problem 6: 404 vs 403 na DELETE — poprawne!**

Plan mówi: "Bezpośredni strzał DELETE (...) kończy się odrzuceniem (401/403) przez Supabase/API". Ale faktyczna implementacja w `[id].ts` zwraca **404**, nie 403:

```typescript
// [id].ts L57-66
if (data.length === 0) {
  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
}
```

To jest poprawne podejście bezpieczeństwa — **nie ujawniamy istnienia zasobu** (404 zamiast 403). Test prawidłowo oczekuje `toBe(404)`.

**Problem 7: Test zakłada że sesja została zapisana do bazy**

Test robi pełny cykl ćwiczeń (start → break → exercises → "Świetna robota!"), a potem `GET /api/session-history` i oczekuje `data.length > 0`. Ale patrząc na [`ExerciseSequence.tsx`](file:///C:/src/10xDevs/mvp-pomostretch/src/components/ExerciseSequence.tsx) — komponent `finishSequence` (L66-78) **nigdy nie wysyła POST do session-history!** Zapisuje tylko `lastSessionIds` do localStorage i czyści ciastko.

Jeśli M5 CRUD endpoint istnieje, ale ExerciseSequence nie robi POST do niego, to `historyA.data` będzie puste i test się wywali na:

```typescript
expect(historyA.data.length).toBeGreaterThan(0); // FAIL — no sessions posted!
```

> [!CAUTION]
> To może być **showstopper**. Trzeba sprawdzić, czy istnieje inny mechanizm zapisujący sesję (np. w PomodoroTimer lub w innym miejscu). Z analizy kodu wynika, że ExerciseSequence **nie zapisuje sesji do bazy**. Albo ta integracja jeszcze nie istnieje, albo jest w innym pliku. Agent zakładał, że sesje trafiają do bazy, ale bez POST-a do API w momencie zakończenia ćwiczeń — nie trafią.

---

## Part 2: Ocena propozycji Idle Break F5-persistence

### Obecny problem

Odświeżenie strony (`/exercise-sequence`) na etapie idle break (drzemki po ćwiczeniach) resetuje cały komponent React. Stan React (`status: "idle_break"`, `idleEndTime`) ginie. Strona Astro sprawdza ciastko `pomostretch.break_input` — jeśli obecne, pozwala renderować stronę i re-hydruje React od zera (status `active`, currentIndex 0), co zmusza do oglądania ćwiczeń od początku.

Główny timer (`PomodoroTimer`) jest trwały na F5, bo zapisuje stan w localStorage (key `pomostretch.timer`).

### Proponowane rozwiązanie — ocena

#### Punkt 1: exercise-storage.ts — ✅ Słuszne podejście

Utworzenie helpera wzorowanego na [`timer-storage.ts`](file:///C:/src/10xDevs/mvp-pomostretch/src/lib/timer-storage.ts), zapisującego:

```typescript
{
  (currentIndex, status, idleEndTime, completedCount, skippedCount);
}
```

**Ocena**: ✅ Prawidłowe. Wzorzec jest sprawdzony w projekcie. Uwagi:

1. **Klucz `pomostretch.exercise_state`** — dobry, spójny z konwencją `pomostretch.*`.
2. **Dodaj `exerciseIds: string[]`** — po F5 potrzebujemy odtworzyć listę ćwiczeń. Sam `currentIndex` nie wystarczy, bo `selectExercises()` jest niedeterministyczny (losowy dobór). Trzeba zapisać **konkretne ID** wylosowanych ćwiczeń, aby po F5 re-fetch je z katalogu:
   ```typescript
   interface ExerciseStoredState {
     exerciseIds: string[]; // zamrożona lista ćwiczeń
     currentIndex: number;
     status: "active" | "completed" | "idle_break";
     idleEndTime: number | null; // Date.now() + minuty
     completedCount: number;
     skippedCount: number;
     savedAt: number; // Date.now() — do walidacji świeżości
   }
   ```
3. **Dodaj TTL / walidację świeżości**: Jeśli `savedAt` jest starszy niż np. 30 minut, zignoruj zapisany stan (prawdopodobnie nieaktualny). Analogia do `timer-storage.ts` gdzie timer jest walidowany przez porównanie `Date.now() - startedAt`.

#### Punkt 2: Opóźnienie czyszczenia ciastka — ✅ Kluczowy fix, ale z zastrzeżeniem

**Obecny flow**:

1. `finishSequence()` → natychmiast `fetch("/api/clear-break-cookie")` → ciastko znika
2. Status zmienia się na `completed`
3. Użytkownik klika "+5 min" → `idle_break`
4. **F5**: Astro sprawdza ciastko → go nie ma → redirect do `/break-input` 💥

**Proponowany flow**:

1. `finishSequence()` → **NIE czyści ciastka**
2. Status zmienia się na `completed` / `idle_break`
3. **F5**: Astro sprawdza ciastko → jest obecne → renderuje stronę → React hydruje i ładuje stan z localStorage → przywraca idle break
4. `handleResumeWork()` / `handleReturnIdle()` → dopiero teraz `fetch("/api/clear-break-cookie")`

**Ocena**: ✅ Architektonicznie poprawne. Ale:

> [!WARNING]
> **Zastrzeżenie: Window of vulnerability**
> Ciastko `pomostretch.break_input` ma `Max-Age: 300` (5 minut, ustawione w [`break-input.ts`](file:///C:/src/10xDevs/mvp-pomostretch/src/pages/api/break-input.ts)). Jeśli idle break trwa dłużej niż 5 minut (a +10 min jest opcją!), ciastko wygasa **zanim** użytkownik kliknie "Wróć do dashboardu". Wtedy:
>
> - F5 w 8. minucie idle break → ciastko wygasło → redirect do `/break-input` 💥
>
> **Fix**: Albo wydłuż Max-Age ciastka (np. na 30 minut), albo odnawiaj ciastko przy starcie idle break, albo zrezygnuj z ciastka jako gate'a dla strony exercise-sequence (zamiast tego sprawdzaj localStorage).

**Rekomendacja**: Ustaw `Max-Age` ciastka na 1800 (30 minut) lub odnawiaj je przy każdym wejściu w idle break. Najprościej: w `finishSequence()` zamiast kasować — docelowo nie ruszaj ciastka.

#### Punkt 3: Czyszczenie localStorage przy wyjściu — ✅ Poprawne

`clearStoredExerciseState()` wywoływane w `handleResumeWork()` i `handleReturnIdle()` — prawidłowe, spójne z `clearStoredTimer()`.

**Uwaga do fixa w `clear-break-cookie.ts`:**

Agent proponuje dodanie flag:

```typescript
context.cookies.delete("pomostretch.break_input", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: import.meta.env.PROD,
});
```

Obecna implementacja:

```typescript
context.cookies.delete("pomostretch.break_input", { path: "/" });
```

✅ Dodanie flag jest poprawne i wymagane — `cookies.delete()` w Astro musi ustawić te same opcje co `cookies.set()`, inaczej przeglądarka nie dopasuje ciastka do usunięcia. Ale:

- ⚠️ `import.meta.env.PROD` w pliku API route — to działa w Astro (dostępne server-side). OK.
- ⚠️ `httpOnly` na `delete` — technicznie poprawne, ale nadmiarowe (delete wysyła `Set-Cookie` z `Max-Age=0`). Nie szkodzi.

### Podsumowanie Idle Break Fix

| Aspekt                      | Ocena | Uwagi                                                                       |
| --------------------------- | ----- | --------------------------------------------------------------------------- |
| LocalStorage na kliencie    | ✅    | Dodaj `exerciseIds[]` i `savedAt` TTL                                       |
| Opóźnione usunięcie ciastka | ✅    | Ale wydłuż `Max-Age` z 300s na 1800s                                        |
| Czyszczenie LS przy wyjściu | ✅    | Spójne z istniejącym wzorcem                                                |
| Bezpieczeństwo              | ✅    | Brak luk — ciastko jest read-only gate, nie auth token                      |
| Architektura SSR + Islands  | ✅    | Poprawne rozdzielenie server-side guard (ciastko) vs client-side state (LS) |

---

## Part 3: Instrukcje implementacyjne dla AI agenta

### Priorytet 1: Naprawy krytyczne (przed wdrożeniem)

#### Fix 1: Weryfikacja zapisu sesji do bazy

Sprawdź, czy `ExerciseSequence.tsx → finishSequence()` wykonuje `POST /api/session-history`. Jeśli nie — dodaj:

```typescript
const finishSequence = useCallback(
  (finalSelectedExercises: Exercise[]) => {
    if (isCompletedHandledRef.current) return;
    isCompletedHandledRef.current = true;

    const ids = finalSelectedExercises.map((ex) => ex.id);
    saveLastSessionIds(ids);

    // Zapis sesji do bazy (M5 integracja)
    fetch("/api/session-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_kind: breakInput.kind,
        input_value: breakInput.value,
        derived_tags: breakInput.tags,
        selected_exercise_ids: ids,
        completed_count: completedCountRef.current,
        skipped_count: skippedCountRef.current,
        ended_at: new Date().toISOString(),
      }),
    }).catch(() => {
      /* ignore */
    });

    // NIE czyść ciastka tutaj (patrz Fix Idle Break)
    setStatus("completed");
  },
  [breakInput],
);
```

> Bez tego test `rls-security.spec.ts` nie ma szans przejść — `historyA.data` będzie puste.

#### Fix 2: Email confirmation w Supabase dla CI

W Supabase Dashboard → Authentication → Settings → Email Auth:

- Wyłącz "Confirm email" **lub**
- Skonfiguruj autoconfirm w `.env` testowym

Bez tego test się zawiesi na próbie logowania po rejestracji.

#### Fix 3: Zabezpieczenie pętli `while` w teście

Zamień `while` na `for` z limitem iteracji (patrz sekcja 1.3, Problem 3).

### Priorytet 2: Implementacja Idle Break persistence

Plik: `src/lib/exercise-storage.ts` (nowy)

```typescript
const EXERCISE_STORAGE_KEY = "pomostretch.exercise_state";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minut

export interface ExerciseStoredState {
  exerciseIds: string[];
  currentIndex: number;
  status: "active" | "completed" | "idle_break";
  idleEndTime: number | null;
  completedCount: number;
  skippedCount: number;
  savedAt: number;
}

export function getStoredExerciseState(): ExerciseStoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const item = window.localStorage.getItem(EXERCISE_STORAGE_KEY);
    if (!item) return null;
    const state = JSON.parse(item) as ExerciseStoredState;
    if (Date.now() - state.savedAt > MAX_AGE_MS) {
      clearStoredExerciseState();
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function saveStoredExerciseState(state: Omit<ExerciseStoredState, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function clearStoredExerciseState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EXERCISE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
```

Zmiany w `ExerciseSequence.tsx`:

1. Przy inicjalizacji (`useState(() => ...)`) sprawdź `getStoredExerciseState()` — jeśli istnieje i `exerciseIds` odpowiadają dostępnym ćwiczeniom, przywróć stan.
2. Przy każdej zmianie stanu (`setCurrentIndex`, `setStatus`, `startIdleBreak`) zapisz stan przez `saveStoredExerciseState()`.
3. W `handleResumeWork()` i `handleReturnIdle()` dodaj `clearStoredExerciseState()` i `fetch("/api/clear-break-cookie")`.
4. Usuń `fetch("/api/clear-break-cookie")` z `finishSequence()`.

Zmiana w `src/pages/api/break-input.ts`:

- Zwiększ `Max-Age` ciastka z 300 (5 min) na 1800 (30 min).

### Priorytet 3: Opcjonalne usprawnienia

1. **Teardown testowych użytkowników** — dodaj `afterAll` w teście z `service_role` key do czyszczenia.
2. **UNIQUE constraint na exercise.name** — dodaj `ALTER TABLE public.exercise ADD CONSTRAINT exercise_name_key UNIQUE (name)` na początku migracji seed.
3. **Lepsze obrazy SVG** — kilka ćwiczeń dzieli te same obrazy (np. "Masaż skroni" → `eye-palming.svg`). Warto wygenerować lub przypisać trafniejsze.

---

## Part 4: Odpowiedź na pytanie o konwencje kursu

### Gdzie zapisywać analizy i review?

Zgodnie z konwencją 10xDevs z AGENTS.md:

```
context/changes/<change-id>/research.md  → ustalenia z wewnętrznego researchu
context/changes/<change-id>/plan.md      → kontrakt implementacyjny
context/changes/<change-id>/review.md    → ← TUTAJ ten plik (review implementacji)
context/foundation/lessons.md            → trwałe reguły i pułapki
```

**Dla poprawki Idle Break**: To jest oddzielna zmiana (nie M8). Powinna mieć własny folder:

```
context/changes/idle-break-persistence/plan.md
```

Nie kopiuj między agentami odpowiedzi tekstowych. Zamiast tego:

- Agent 1 zapisuje analizę/plan do `context/changes/<id>/plan.md`
- Agent 2 czyta ten plik i implementuje

Ten plik (`review.md`) jest zapisany w `context/changes/m8-polish/review.md` i może być odczytany przez dowolnego agenta implementującego poprawki.
