# Implementation Plan: Ujednolicenie języka polskiego, Zen Mode i semantyka Timera

## Current State Analysis
- Interfejs autoryzacji (`src/components/auth/SignInForm.tsx`, `src/components/auth/SignUpForm.tsx`, `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`) oraz pasek nawigacyjny (`src/components/Topbar.astro`) zawierają twardo zakodowane angielskie frazy ("Sign in", "Sign out", "Email is required", "Password is required").
- Błędy autoryzacji z Supabase (`error.message` z `src/pages/api/auth/signin.ts` i `src/pages/api/auth/signup.ts`) wyciekają w języku angielskim (np. "Invalid login credentials") przez query parameter `?error=...` bezpośrednio do interfejsu użytkownika.
- W `src/pages/dashboard.astro` dominuje duży kontener z adresem email użytkownika oraz zdublowanym przyciskiem wylogowania, wewnątrz którego umieszczono `<InfoButton />`.
- Podczas trwania 25-minutowej sesji Pomodoro w `src/pages/dashboard.astro` nawigacja i elementy poboczne są stale w 100% widoczne, generując zbędny szum wizualny (brak trybu głębokiej pracy / Zen Mode).
- W `src/components/PomodoroTimer.tsx` przycisk "Zakończ" prowadzi bezpośrednio do `/break-input` (rozpoczęcie przerwy i rozciągania), co jest mylące semantycznie. Brakuje bezpiecznego sposobu na porzucenie/zresetowanie sesji w przypadku przerwania pracy. Ponadto istniejące testy E2E (`tests/e2e/us-01.spec.ts` i `tests/e2e/break-input.spec.ts`) klikają przycisk o nazwie "Zakończ".

## Proposed Solution
- **Faza 1 (i18n & Error Handling)**: Utworzenie modułu `src/lib/auth-errors.ts` z mapowaniem i bezpiecznym fallbackiem oraz przetłumaczenie formularzy auth (`SignInForm.tsx`, `SignUpForm.tsx`, `signin.astro`, `signup.astro`). Dodanie testów jednostkowych `src/lib/auth-errors.test.ts`.
- **Faza 2 (Layout & InfoButton Integration)**: Integracja `<InfoButton />` wewnątrz `Topbar.astro` (obok przycisku wylogowania, likwidując ryzyko kolizji). Przeniesienie `Topbar` na górę `dashboard.astro` (szeroki kontener layoutowy spójny z `history.astro`), usunięcie wielkiego boksu powitalnego i wyśrodkowanie timera.
- **Faza 3 (Zen Mode & Timer Semantics)**: Dodanie utility `.zen-fade` w `src/styles/global.css` sterowanego klasą `zen-active` na `document.body`. W `PomodoroTimer.tsx` dynamiczne włączanie/wyłączanie klasy `zen-active` w `useEffect` (z cleanupem). Zmiana etykiety przycisku przejścia do przerwy z "Zakończ" na "Do przerwy" (lub kompatybilnego `/Zakończ|Do przerwy/`), dodanie dyskretnego przycisku "Porzuć sesję" z oknem potwierdzenia (`window.confirm`) oraz aktualizacja testów E2E.

## Scope Boundaries
- **In Scope**:
  - Tłumaczenie UI formularzy logowania, rejestracji i Topbara na język polski.
  - Tłumacz komunikatów błędów Supabase z bezpiecznym fallbackiem.
  - Usunięcie boksu powitania z `dashboard.astro`, integracja `InfoButton` z `Topbar`.
  - Zen Mode wygaszający Topbar podczas aktywnego timera.
  - Uporządkowanie semantyki przycisków w timerze (przejście do przerwy + bezpieczne porzucenie sesji).
  - Aktualizacja powiązanych testów E2E i dodanie testów jednostkowych dla translatora błędów.
- **Out of Scope**:
  - Wprowadzanie biblioteki wielojęzyczności i18n (np. `astro-i18next` / `react-intl`) – na tym etapie MVP projekt operuje wyłącznie w języku polskim.
  - Dodawanie przycisku "-5 minut" (odrzucone ze względów ergonomii interfejsu i skupienia).
  - Modyfikacja bazy danych lub tabel Supabase.

---

## Phase 1: i18n formularzy i tłumaczenie błędów Supabase

### Overview
Wprowadzenie pełnego tłumaczenia formularzy autoryzacji oraz bezpiecznego mapowania błędów Supabase Auth na język polski wraz z testami jednostkowymi.

### Changes Required:

#### 1. Słownik błędów autoryzacji
**File**: `src/lib/auth-errors.ts`
**Intent**: Tworzy funkcję `translateAuthError`, która mapuje znane komunikaty błędów z Supabase Auth na polski, a dla nieznanych zwraca bezpieczny fallback.
**Contract**:
```typescript
export function translateAuthError(rawError: string | null | undefined): string | null {
  if (!rawError) return null;
  const mapping: Record<string, string> = {
    "Invalid login credentials": "Nieprawidłowy adres email lub hasło.",
    "User already registered": "Użytkownik o tym adresie email już istnieje.",
    "Email not confirmed": "Adres email nie został potwierdzony.",
    "Password should be at least 6 characters": "Hasło musi mieć co najmniej 6 znaków.",
    "Email and password are required": "Adres e-mail i hasło są wymagane.",
    "Supabase is not configured": "Błąd konfiguracji bazy danych.",
  };
  return mapping[rawError] ?? "Wystąpił błąd autoryzacji. Spróbuj ponownie.";
}
```

#### 2. Testy jednostkowe tłumacza błędów
**File**: `src/lib/auth-errors.test.ts`
**Intent**: Weryfikuje mapowanie popularnych błędów ("Invalid login credentials", "User already registered") oraz działanie fallbacku dla nieznanych komunikatów.

#### 3. Tłumaczenie SignInForm
**File**: `src/components/auth/SignInForm.tsx`
**Intent**: Spolszczenie etykiet, placeholderów, walidacji inline ("Adres e-mail jest wymagany", "Hasło jest wymagane"), tekstu przycisku ("Zaloguj się", stan "Logowanie...") oraz przepuszczenie `serverError` przez `translateAuthError`.

#### 4. Tłumaczenie SignUpForm
**File**: `src/components/auth/SignUpForm.tsx`
**Intent**: Spolszczenie etykiet, placeholderów, hintu hasła ("jeszcze X znaków"), walidacji inline oraz tekstu przycisku ("Zarejestruj się", stan "Rejestracja..."), a także obsługa `translateAuthError(serverError)`.

#### 5. Tłumaczenie stron auth
**Files**: `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`
**Intent**: Aktualizacja tytułów stron (`title`), nagłówków `<h1>` oraz linków w stopkach ("Nie masz konta? Zarejestruj się", "Masz już konto? Zaloguj się").

### Success Criteria:

#### Automated Verification:
- Testy jednostkowe tłumacza przechodzą pomyślnie: `npx vitest run src/lib/auth-errors.test.ts`
- Cały zestaw testów jednostkowych przechodzi: `npm test`
- Linter i sprawdzanie typów bez błędów: `npm run lint`

#### Manual Verification:
- Odwiedzenie `/auth/signin` oraz `/auth/signup` – wszystkie teksty, placeholdery i komunikaty walidacji są w poprawnym języku polskim.
- Błędne logowanie wyświetla czytelny polski komunikat błędu zamiast angielskiego.

---

## Phase 2: Refaktoryzacja Dashboardu i integracja InfoButton z Topbar

### Overview
Wyprowadzenie paska nawigacyjnego `Topbar` na górę `dashboard.astro`, integracja `<InfoButton />` wewnątrz `Topbar` (likwidacja kolizji UI) oraz usunięcie niepotrzebnego, dominującego bloku z adresem email.

### Changes Required:

#### 1. Integracja InfoButton i tłumaczenie Topbar
**File**: `src/components/Topbar.astro`
**Intent**:
- Spolszczenie etykiet ("Niezalogowany", "Zaloguj się", "Zarejestruj się", "Wyloguj się").
- Umieszczenie komponentu `<InfoButton client:load />` wewnątrz paska nawigacji (po prawej stronie, obok przycisku wylogowania).
- Dodanie klasy `zen-fade` do kontenera paska dla obsługi wygaszania w trybie Zen.

#### 2. Uproszczenie struktury Dashboardu
**File**: `src/pages/dashboard.astro`
**Intent**:
- Usunięcie dużego bloku `<div class="relative mb-8 ...">` zawierającego email i zdublowany przycisk wylogowania.
- Umieszczenie `<Topbar />` na szczycie widoku w responsywnym kontenerze (`w-full max-w-4xl mx-auto px-4 pt-4`), identycznie jak w `history.astro`.
- Wycentrowanie `PomodoroTimer` jako głównego punktu skupienia widoku.

### Success Criteria:

#### Automated Verification:
- Linter i formatowanie przechodzą bez błędów: `npm run lint`
- Kompilacja projektu Astro przechodzi pomyślnie: `npm run build`

#### Manual Verification:
- Otwarcie `/dashboard`: na samej górze widoczny jest spójny `Topbar` z zintegrowanym przyciskiem `InfoButton`, bez wielkiego okna powitalnego.
- Kliknięcie w `InfoButton` otwiera modal z informacjami o aplikacji bez nakładania się na przycisk wylogowania.

---

## Phase 3: Zen Mode w Dashboardzie i semantyka przycisków Timera

### Overview
Wdrożenie wygaszania nawigacji podczas aktywnej sesji (Zen Mode) oraz dopracowanie semantyki przycisków timera (wyraźne przejście do przerwy, bezpieczne porzucenie sesji z potwierdzeniem, aktualizacja testów E2E).

### Changes Required:

#### 1. Style Zen Mode w CSS
**File**: `src/styles/global.css`
**Intent**: Dodanie reguł `@utility zen-fade` oraz styli dla `body.zen-active .zen-fade` wygaszających pasek do `opacity-15` i przywracających `opacity-100` po najechaniu kursorem (`transition: opacity 300ms ease`).

#### 2. Obsługa stanu Zen Mode i semantyka przycisków w PomodoroTimer
**File**: `src/components/PomodoroTimer.tsx`
**Intent**:
- W `useEffect` dodawanie klasy `zen-active` do `document.body` wyłącznie gdy `status === "active"`, z obowiązkowym usunięciem klasy w funkcji cleanup.
- Zmiana etykiety przycisku przejścia do przerwy na "Do przerwy" oraz ikony na `FastForward` (lucide-react). Zachowanie atrybutu `aria-label="Zakończ i przejdź do przerwy"`.
- Dodanie subtelnego przycisku "Porzuć sesję" (`variant="ghost"`, mały font) z potwierdzeniem `window.confirm("Czy na pewno chcesz porzucić tę sesję bez zapisywania?")`, który wywołuje `skipAndStartNew()`.

#### 3. Aktualizacja selektorów w testach E2E
**Files**: `tests/e2e/us-01.spec.ts`, `tests/e2e/break-input.spec.ts`
**Intent**: Aktualizacja selektora przycisku z `getByRole("button", { name: "Zakończ" })` na `getByRole("button", { name: /Zakończ|Do przerwy/ })`, aby testy E2E przechodziły bez względu na nowy wariant nazwy przycisku.

### Success Criteria:

#### Automated Verification:
- Testy jednostkowe przechodzą: `npm test`
- Testy E2E przechodzą: `npx playwright test tests/e2e/us-01.spec.ts tests/e2e/break-input.spec.ts`
- Pełny build i linting przechodzą: `npm run lint && npm run build`

#### Manual Verification:
- Uruchomienie sesji Pomodoro w dashboardzie: po kliknięciu "Rozpocznij nową sesję" `Topbar` łagodnie wygasza się do minimalnej przezroczystości; po najechaniu myszką odzyskuje pełną widoczność.
- Kliknięcie "Porzuć sesję" pyta o potwierdzenie; po zatwierdzeniu resetuje timer do stanu początkowego bez kierowania do `/break-input`.
- Kliknięcie "Do przerwy" natychmiast przenosi do wyboru obszaru rozciągania (`/break-input`).

---

## Testing Strategy
- **Unit Tests**:
  - `src/lib/auth-errors.test.ts`: Testuje mapowanie znanych komunikatów błędów Supabase na polski, obsługę wartości null/undefined oraz generyczny polski fallback dla nieznanych błędów.
- **E2E Tests**:
  - Weryfikacja całego cyklu Pomodoro (`tests/e2e/us-01.spec.ts`).
  - Weryfikacja przejścia do formularza przerwy (`tests/e2e/break-input.spec.ts`).
- **Manual Smoke Test**:
  - Przetestowanie formularza logowania z błędnymi danymi.
  - Rozpoczęcie sesji, sprawdzenie efektu Zen Mode, przetestowanie porzucenia sesji z anulowaniem i potwierdzeniem.

## References
- Audyt planu: dyskusja i wnioski z 10x-plan-review.
- Spójność z widokiem historii: `src/pages/history.astro`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: i18n formularzy i tłumaczenie błędów Supabase

#### Automated

- [x] 1.1 Testy jednostkowe tłumacza przechodzą pomyślnie: npx vitest run src/lib/auth-errors.test.ts — 297a487
- [x] 1.2 Cały zestaw testów jednostkowych przechodzi: npm test — 297a487
- [x] 1.3 Linter i sprawdzanie typów bez błędów: npm run lint — 297a487

#### Manual

- [x] 1.4 Odwiedzenie /auth/signin oraz /auth/signup – wszystkie teksty i walidacje w języku polskim — 297a487
- [x] 1.5 Błędne logowanie wyświetla czytelny polski komunikat błędu zamiast angielskiego — 297a487

### Phase 2: Refaktoryzacja Dashboardu i integracja InfoButton z Topbar

#### Automated

- [x] 2.1 Linter i formatowanie przechodzą bez błędów: npm run lint
- [x] 2.2 Kompilacja projektu Astro przechodzi pomyślnie: npm run build

#### Manual

- [x] 2.3 Spójny Topbar na szczycie dashboardu z zintegrowanym InfoButton bez nakładania się elementów
- [x] 2.4 Kliknięcie w InfoButton otwiera modal z informacjami o aplikacji

### Phase 3: Zen Mode w Dashboardzie i semantyka przycisków Timera

#### Automated

- [ ] 3.1 Testy jednostkowe przechodzą: npm test
- [ ] 3.2 Testy E2E przechodzą: npx playwright test tests/e2e/us-01.spec.ts tests/e2e/break-input.spec.ts
- [ ] 3.3 Pełny build i linting przechodzą: npm run lint && npm run build

#### Manual

- [ ] 3.4 Topbar łagodnie wygasza się w trakcie aktywnej sesji (Zen Mode) i wraca po najechaniu myszką
- [ ] 3.5 Przycisk Porzuć sesję wymaga potwierdzenia i resetuje sesję bez przekierowania do przerwy
- [ ] 3.6 Przycisk Do przerwy natychmiast przenosi do wyboru ćwiczeń rozciągających
