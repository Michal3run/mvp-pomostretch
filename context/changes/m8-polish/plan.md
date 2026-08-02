# Plan implementacji: M8 Polish (Post-MVP)

## Zakres

### 1. Rozbudowa bazy ćwiczeń w Supabase
Wzbogacenie produkcyjnej puli ćwiczeń w bazie danych, aby algorytm no-repeat z Rule Engine miał większy wachlarz możliwości.
- **Działania**: Wygenerowanie nowego pliku migracji `20260802143000_seed_more_exercises.sql`, który załączy INSERTY kolejnych ćwiczeń: minimum 5 nowych dla tagu `eyes` (np. Masaż skroni, Spoglądanie na kciuk w ruchu, Szybkie mruganie, Wodzenie wzrokiem po ósemce, Rozluźnianie powiek), 2-3 nowe dla `neck` oraz 2 dla `lower_back`.
- **Wymagania**: Migracja musi być idempotentna (użycie `INSERT ... ON CONFLICT (name) DO NOTHING` lub `WHERE NOT EXISTS`), zgodnie z lekcją L19, by uniknąć duplikatów przy ponownym uruchomieniu.

### 2. Panel Informacyjny (Info Overlay)
Stworzenie przystępnego panelu wprowadzającego dla użytkowników (onboarding).
- **Działania**:
  - Skorzystanie z gotowych komponentów `shadcn/ui` (`Dialog` lub `Sheet` - jeśli nie ma ich w systemie, dodamy je poleceniem `npx shadcn@latest add dialog`). Upewnienie się, że element posiada `aria-label` i zamyka się klawiszem Escape (dostępność).
  - Stworzenie komponentu React `src/components/InfoButton.tsx`, który zostanie wstawiony w `src/pages/dashboard.astro` w prawym górnym rogu (client:load, gdyż nakładka wymaga React).
  - Treść panelu: 
    1. Co to jest PomoStretch (1 zdanie), 
    2. Jak działa (3 kroki: praca -> wybór strefy bólu -> ćwiczenia), 
    3. Co fajnego (brak powtórzeń, personalizacja, historia), 
    4. Wskazówki (np. "wybierz 'Zaskocz mnie' aby ćwiczyć losowo"),
    5. **Dla oceniających MVP**: Krótka wzmianka techniczna uświadamiająca, że aplikacja posiada pełny **CRUD** pod spodem (Historia sesji jest zapisywana, odczytywana i można ją usuwać z bazy Supabase z pełnym RLS per użytkownik).

### 3. Zaawansowane Testy E2E dla bezpieczeństwa RLS
Dodanie testu symulującego izolację środowiska per użytkownik.
- **Działania**:
  - Nowy plik `tests/e2e/rls-security.spec.ts`.
  - Kod zarejestruje Użytkownika A i wygeneruje na jego koncie nową sesję (start -> przerwa), a następnie wyloguje i zarejestruje/zaloguje Użytkownika B (z nowym emailem, wymaga włączonej lub skonfigurowanej rejestracji testowej w Supabase/local env).
  - Następnie skrypt sprawdzi na koncie B:
    1. Lista historii w UI jest pusta (nie widać sesji A).
    2. Bezpośredni strzał DELETE / API (lub przez zapytanie z tokenem B) na `/api/session-history/{id_of_A}` kończy się odrzuceniem (401/403) przez Supabase/API - zgodnie z lekcją L15 weryfikując inline auth check na trasach API.

## Akceptacja
Użytkownik musi potwierdzić uruchomienie implementacji (po wpisaniu `/10x-implement m8-polish phase 1`).
