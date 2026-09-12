# Ujednolicenie języka polskiego i Zen Mode w Dashboardzie — Plan Brief

> Full plan: `context/changes/ui-polish-redesign/plan.md`

## What & Why
Ujednolicenie interfejsu aplikacji na język polski (w tym eliminacja wycieków anglojęzycznych błędów z Supabase Auth), usunięcie zbędnego bloku powitania w Dashboardzie na rzecz zintegrowanego paska nawigacji, wprowadzenie trybu Zen Mode w trakcie sesji Pomodoro oraz dopracowanie semantyki przycisków w timerze. Zmiana podnosi ergonomię i usuwa szum wizualny podczas głębokiej pracy.

## Starting Point
Aplikacja posiada przetłumaczony Landing Page i widok Historii, ale moduł uwierzytelniania i Topbar mają twardo zakodowane angielskie frazy. Dashboard zawiera dominujący blok z emailem i przyciskiem wylogowania, a timer stale wyświetla całą nawigację. Przycisk "Zakończ" prowadzi do przerwy bez możliwości bezpiecznego anulowania sesji.

## Desired End State
Całość interfejsu (formularze, walidacje, błędy backendowe, pasek górny) operuje w języku polskim. W Dashboardzie na samej górze widoczny jest spójny Topbar ze zintegrowanym InfoButtonem, który po rozpoczęciu sesji wygasza się do 15% (Zen Mode). Użytkownik widzi jednoznaczny przycisk "Do przerwy" oraz ma możliwość bezpiecznego porzucenia sesji po potwierdzeniu.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Obsługa błędów Supabase | Dedykowany helper `src/lib/auth-errors.ts` z fallbackiem | Zapobiega wyciekaniu angielskich komunikatów backendu do polskiego UI. | Plan Review |
| Pozycja `InfoButton` | Integracja wewnątrz `Topbar.astro` | Likwiduje kolizję nakładania się elementu `fixed` na przycisk wylogowania w nagłówku. | Plan Review |
| Zen Mode w Dashboardzie | Klasa `zen-active` na `document.body` z cleanupem | Czyste, reaktywne wygaszanie statycznego nagłówka z poziomu React Island. | Plan Review |
| Przycisk "-5 minut" | Odrzucony | Zgodnie z audytem UX stanowi zbędny szum poznawczy i zaburza ergonomię skupienia. | Plan Review |
| Porzucenie sesji | Dyskretny przycisk z `window.confirm` | Chroni przed przypadkowym zresetowaniem sesji skupienia pod koniec cyklu. | Plan Review |

## Scope

**In scope:**
- Spolszczenie formularzy SignIn, SignUp i Topbara oraz komunikatów walidacji.
- Helper tłumaczący błędy Supabase wraz z testami jednostkowymi.
- Przebudowa Dashboardu: usunięcie bloku z mailem, przeniesienie Topbara na szczyt.
- Wbudowanie `InfoButton` do `Topbar.astro`.
- Zen Mode (`opacity-15` z powrotem na hover) podczas odliczania.
- Semantyka przycisków: "Do przerwy" + bezpieczne "Porzuć sesję" + aktualizacja testów E2E.

**Out of scope:**
- Biblioteki i18n (projekt jest jednojęzyczny – polski).
- Przycisk "-5 minut".
- Zmiany w schemacie bazy Supabase.

## Architecture / Approach
Nawigacja zostaje ujednolicona w `src/components/Topbar.astro` i zawiera w sobie `InfoButton`. React island (`PomodoroTimer.tsx`) zarządza klasą `zen-active` na elemencie `body` w hooku `useEffect` (z automatycznym usuwaniem przy odmontowaniu). Style Tailwind 4 w `src/styles/global.css` odpowiadają za płynną animację wygaszania.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. i18n & Error Handling | Spolszczone formularze auth i tłumacz błędów Supabase z testami | Wyciek nieznanego błędu (zaadresowany fallbackiem) |
| 2. Dashboard & Topbar | Czysty Dashboard, InfoButton w Topbarze | Rozjazd stylów między widokami |
| 3. Zen Mode & Timer Controls | Tryb skupienia, czytelne przyciski, zielone testy E2E | Regresja istniejących testów E2E sprawdzających button "Zakończ" |

**Prerequisites:** Działające środowisko deweloperskie i testy (`npm test`).
**Estimated effort:** ~1-2 godziny implementacji w 3 krokach.

## Open Risks & Assumptions
- Zmiana selektora przycisku z "Zakończ" na "Do przerwy" wymaga aktualizacji w `tests/e2e/us-01.spec.ts` oraz `tests/e2e/break-input.spec.ts`. Faza 3 bezpośrednio to adresuje.

## Success Criteria (Summary)
- Brak jakichkolwiek angielskich fraz w procesie logowania/rejestracji oraz w błędach z backendu.
- Topbar nie koliduje z InfoButtonem i wygasza się w trakcie pracy timera.
- Wszystkie testy jednostkowe i E2E przechodzą w 100%.
