# Research - M6 Testing & Certification

## Cel
Zrozumienie wpływu zmian wdrożonych w ramach M7 (UAT & Polish) na planowane testy E2E (Playwright) oraz Unit (Vitest) dla Milestone 6. Zebranie dowodów z kodu niezbędnych do zaplanowania "Minimum-viable test set for certification" (Ryzyka R-03 i R-04).

## Internal Research (Codebase)

### Zmiany z M7 (UAT & Polish)
1. **Polskie etykiety i teksty (do wykorzystania w Playwright locators):**
   - Dashboard: `"Gotowy na sesję?"`, `"Rozpocznij nową sesję"` (przycisk Start), `"Zakończ"` (przycisk Manual End).
   - Break Input: Przycisk `value="Tylko kark"`, `"Tylko oczy"`, `"Ogólne"`, `"Zaskocz mnie"`.
   - Exercise Sequence: `"Zrobione"`, `"Pomiń"`, ekran po ćwiczeniach: `"Świetna robota!"`, przycisk powrotu: `"Rozpocznij nową sesję (25 min)"`.
2. **Hydracja i Skeleton Loader:**
   - Komponent `PomodoroTimer.tsx` podczas ładowania (przed zmontowaniem na kliencie) renderuje: `<div className="... animate-pulse ... />`.
   - Testy E2E **muszą** poczekać na zakończenie hydracji (np. `await expect(page.getByText('Gotowy na sesję?')).toBeVisible()`) zanim spróbują kliknąć przycisk startu.
3. **Nowy ficzer - Idle Break:**
   - Po wykonaniu zestawu ćwiczeń użytkownik widzi ekran z opcją drzemki/relaksu (`+3 min`, `+5 min`, `+10 min`). 
   - Aby zamknąć cykl US-01, test Playwright musi kliknąć `"Rozpocznij nową sesję (25 min)"`, co pominie opcjonalny idle break i zresetuje timer (powrót do Dashboard).

### Reguły testowania R-04 (Vitest)
1. Plik: `src/lib/rule-engine.ts`.
2. Funkcja `selectExercises({ tags, lastSessionIds, catalog })`.
3. Quick-pick tags do przetestowania: `eyes`, `neck`, `general`, `random`.
4. R-04 wymaga udowodnienia, że każda z 4 opcji (w oparciu o zamockowany katalog) zawsze zwraca >= 1 ćwiczenie. Należy upewnić się, że fallback na "general" (dla pustego tagu lub braku wyników) działa poprawnie.

## External Research (Astro + Playwright/Vitest)
1. **Vitest z Astro:** Zgodnie z oficjalną dokumentacją Astro, Vitest jest preferowanym runnerem dla unit testów. Konfiguracja poprzez `getViteConfig()` z `astro/config`.
2. **Playwright z Astro:** Rekomendowane podejście to testowanie środowiska preview (E2E). Playwright może użyć webServer z komendą `npm run preview`. Należy pamiętać o mockowaniu logowania Supabase (lub logowaniu przez UI przy użyciu konta testowego, upewniając się, że zmienne środowiskowe istnieją). Z uwagi na `client:load` (React), mechanizmy Playwrighta (auto-wait dla widoczności elementów) poradzą sobie doskonale z React Islands, o ile asercje sprawdzają widoczność tekstów zamiast tylko obecności w DOM.
3. **Mockowanie czasu w Playwright:** Ponieważ PomoStretch używa `Date.now()` oraz `setInterval`, można wykorzystać eksperymentalne API Playwright `page.clock.install()` + `page.clock.fastForward('25:00')` do przewinięcia czasu w przeglądarce, unikając czekania 25 minut. Alternatywnie, test US-01 może po prostu kliknąć przycisk "Zakończ" (Manual End), by zrealizować cykl zgodnie z M2 ("Manually end session early").

## Wnioski dla planu
- Konfiguracja Playwrighta wymaga postawienia serwera deweloperskiego/preview. Zastosujemy podejście z logowaniem testowego użytkownika przez UI lub obejście w M0. Ponieważ zdefiniowano, że użyjemy ręcznego zakończenia (Manual End early), użycie "Zakończ" na timerze to idealny happy path dla testu R-03.
- Do konfiguracji Vitest wystarczy paczka `vitest` i test `rule-engine.test.ts`.
