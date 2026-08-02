# Plan - M6 Testing & Certification

Ten plan stanowi twardy kontrakt dla etapu testowania (Minimum-viable test set for certification), opierając się na badaniach (research.md) i uwzględniając zmiany wdrożone w M7.

## Zależności i Stack
- **Framework E2E**: `@playwright/test` (R-03)
- **Framework Unit Testów**: `vitest` (R-04)
- **Skrypty**: Dodanie `npm run test` (dla vitest) oraz `npm run test:e2e` (dla Playwright) do `package.json`.

## Faza 1: Konfiguracja
1. **Instalacja frameworków**:
   `npm install -D playwright @playwright/test vitest`
   `npx playwright install --with-deps chromium` (tylko jeden silnik na potrzeby CI/certyfikacji)
2. **Konfiguracja Vitest** (`vitest.config.ts`):
   Standardowa integracja z Vite (konfiguracja odpowiednich aliasów z `tsconfig.json`).
3. **Konfiguracja Playwright** (`playwright.config.ts`):
   Ustawienie `webServer` działającego na `npm run dev` lub `npm run preview`. Adres `baseURL: http://localhost:4321`. Konfiguracja tylko dla przeglądarki Desktop Chrome, by zminimalizować czas trwania testów. Ustawienie testDir na `tests/e2e/`.

## Faza 2: Unit Testy (R-04)
Cel: Zabezpieczenie R-04 - "Rule engine zwraca pustą sekwencję dla któregoś z 4 quick-picków".
- Utworzenie pliku: `tests/unit/rule-engine.test.ts` (lub `src/lib/rule-engine.test.ts`).
- Zbudowanie "mock catalog" składającego się z ok. 5-6 ćwiczeń obejmujących tagi: `eyes`, `neck`, `shoulders`, `lower_back`, `general`.
- Test 1: Sprawdzenie, czy wejście `{ tags: ['eyes'] }` zwraca >= 1 ćwiczenie z mock katalogu.
- Test 2: Sprawdzenie, czy wejście `{ tags: ['neck'] }` zwraca >= 1 ćwiczenie.
- Test 3: Sprawdzenie `{ tags: ['general'] }`.
- Test 4: Sprawdzenie `{ tags: ['random'] }`.
- Uruchomienie lokalnie i sprawdzenie na zielono.

## Faza 3: E2E Happy Path Test (R-03)
Cel: Zabezpieczenie US-01 od początku do końca, łącznie z nowym UI z M7.
- Utworzenie pliku: `tests/e2e/us-01.spec.ts`.
- **Kroki testu**:
  1. Wejście na `/auth/signin`. Logowanie podanymi credentials testowymi (zmienne w pliku konfiguracyjnym lub mockowane).
  2. Sprawdzenie przekierowania na `/dashboard`.
  3. Oczekiwanie na zakończenie hydracji React: `await expect(page.getByText('Gotowy na sesję?')).toBeVisible()`.
  4. Kliknięcie `"Rozpocznij nową sesję"` (Timer wchodzi w stan active).
  5. Kliknięcie `"Zakończ"` (Manual End). Test E2E wykorzysta ten przycisk, aby pominąć czekanie 25 minut. Następuje przekierowanie na `/break-input`.
  6. Wybór przerwy: kliknięcie przycisku `value="Tylko kark"`.
  7. Sprawdzenie, czy jesteśmy na `/exercise-sequence` (np. widoczność `"Zrobione"`).
  8. Przejście przez wszystkie (1-3) ćwiczenia - pobieranie przycisku `"Zrobione"` i klikanie w pętli, dopóki widoczne.
  9. Sprawdzenie końcowego ekranu: asercja istnienia tekstu `"Świetna robota!"`.
  10. Ominięcie Idle Break - kliknięcie przycisku `"Rozpocznij nową sesję (25 min)"`.
  11. Asercja powrotu na `/dashboard` i widoczności aktywnego timera (`Czas skupienia`).

## Faza 4: CI & Wpięcie do GitHub Actions
- Aktualizacja `.github/workflows/ci.yml`.
- Dodanie joba uruchamiającego testy jednostkowe `npm run test --run`.
- Dodanie joba dla Playwright: instalacja i uruchomienie `npx playwright test`. Podpięcie zmiennych środowiskowych `SUPABASE_URL` i `SUPABASE_KEY` z repozytorium/sekretów, aby testy mogły przejść autoryzację.

---
Ten plan zamyka zakres badawczy i tworzy ramy do odpalenia `/10x-implement`. Zapewnia najszybszą pętlę sprzężenia zwrotnego na certyfikację M6.
