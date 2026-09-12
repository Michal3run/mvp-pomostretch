# Idle Break Persistence — Implementation Plan

## Problem

Odświeżenie strony (F5) na `/exercise-sequence` w fazie `idle_break` (drzemka po ćwiczeniach) powoduje:

1. Utratę stanu React → komponent `ExerciseSequence.tsx` re-inicjalizuje się od zera
2. Re-renderowanie ćwiczeń od początku zamiast przywrócenia timera drzemki
3. Problem jest spowodowany brakiem persystencji stanu ćwiczeń w localStorage (w odróżnieniu od głównego timera `PomodoroTimer`, który działa poprawnie na F5)

## Kontekst techniczny

- **Główny timer**: Zapisuje stan w `localStorage` pod kluczem `pomostretch.timer` (helper: `src/lib/timer-storage.ts`).
- **Sekwencja ćwiczeń**: Stan jest wyłącznie w pamięci React (`useState`). Po F5 ginie.
- **Gate SSR**: Strona `exercise-sequence.astro` wymaga ciastka `pomostretch.break_input` (ważne 5 minut). Bez niego → redirect do `/break-input`.
- **Obecna logika**: `finishSequence()` natychmiast czyści ciastko (`fetch("/api/clear-break-cookie")`), więc po wejściu w `idle_break` i F5 — ciastko może już nie istnieć → redirect.

## Rozwiązanie — 3 filary

### Filar 1: `exercise-storage.ts` (nowy plik)

Nowy helper `src/lib/exercise-storage.ts` wzorowany na `timer-storage.ts`.

**Kluczowy interfejs stanu**:

```typescript
interface ExerciseStoredState {
  exerciseIds: string[]; // zamrożona lista wylosowanych ćwiczeń (do odtworzenia po F5)
  currentIndex: number;
  status: "active" | "completed" | "idle_break";
  idleEndTime: number | null; // timestamp końca drzemki
  completedCount: number;
  skippedCount: number;
  savedAt: number; // timestamp zapisu — do walidacji TTL
}
```

Klucz localStorage: `pomostretch.exercise_state`.
TTL: 30 minut (jeśli `Date.now() - savedAt > 30min` → zignoruj i wyczyść).

**Funkcje**: `getStoredExerciseState()`, `saveStoredExerciseState()`, `clearStoredExerciseState()`.

### Filar 2: Opóźnione czyszczenie ciastka

**Zmiana w `ExerciseSequence.tsx`**:

- `finishSequence()` → **USUŃ** wywołanie `fetch("/api/clear-break-cookie")`
- `handleResumeWork()` → **DODAJ** `fetch("/api/clear-break-cookie")` + `clearStoredExerciseState()`
- `handleReturnIdle()` → **DODAJ** `fetch("/api/clear-break-cookie")` + `clearStoredExerciseState()`

**Zmiana w `src/pages/api/break-input.ts`**:

- Zwiększ `Max-Age` ciastka z `300` (5 min) na `1800` (30 min), aby pokryć scenariusze z długimi drzemkami (+10 min, +5 min kilka razy).

**Zmiana w `src/pages/api/clear-break-cookie.ts`**:

- Dodaj pełne opcje kasowania, aby przeglądarka poprawnie dopasowała ciastko:
  ```typescript
  context.cookies.delete("pomostretch.break_input", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });
  ```

### Filar 3: Hydration z localStorage w `ExerciseSequence.tsx`

**Zmiana w inicjalizacji stanów** (w callback `useState`):

1. Na początku sprawdź `getStoredExerciseState()`
2. Jeśli istnieje i `exerciseIds` nie są puste:
   - Odfiltruj ćwiczenia z `catalog` po zapisanych `exerciseIds` (zachowaj kolejność)
   - Przywróć `currentIndex`, `status`, `completedCount`, `skippedCount`
   - Jeśli `status === "idle_break"` i `idleEndTime > Date.now()` → przywróć timer drzemki
   - Jeśli `idleEndTime <= Date.now()` → pokaż "Koniec drzemki!" (jak normalny timeout)
3. Jeśli nie istnieje lub nieważny → standardowa inicjalizacja (`selectExercises(...)`)

**Zapis stanu**: W `useEffect` reagujący na zmianę `[currentIndex, status, idleEndTime, completedCount, skippedCount]` — zapisz do localStorage.

## Pliki do zmodyfikowania

| Plik                                  | Akcja    | Opis                                                           |
| ------------------------------------- | -------- | -------------------------------------------------------------- |
| `src/lib/exercise-storage.ts`         | **NOWY** | Helper localStorage dla stanu ćwiczeń                          |
| `src/components/ExerciseSequence.tsx` | Edycja   | Inicjalizacja z LS, zapis stanu, opóźnione czyszczenie ciastka |
| `src/pages/api/break-input.ts`        | Edycja   | Max-Age ciastka: 300 → 1800                                    |
| `src/pages/api/clear-break-cookie.ts` | Edycja   | Dodanie pełnych flag kasowania ciastka                         |

## Bezpieczeństwo

- Brak luk: ciastko `pomostretch.break_input` jest wyłącznie gate'em SSR (pozwala renderować stronę), nie jest tokenem auth. Wydłużenie jego TTL nie daje żadnych dodatkowych uprawnień.
- localStorage nie zawiera danych wrażliwych (tylko indeksy ćwiczeń i timestampy).
- Czyszczenie następuje zawsze przy wyjściu na dashboard — brak ryzyka "wiszącej" sesji.

## Testy walidacyjne (manualne)

1. Start → timer → break → neck → ćwiczenia → Świetna robota → +5 min → F5 → **Oczekiwanie**: timer drzemki widoczny z poprawnym czasem.
2. Jak wyżej, ale czekaj aż drzemka się skończy → F5 → **Oczekiwanie**: ekran "Koniec drzemki!" z przyciskami powrotu.
3. Start → timer → break → ćwiczenia (w trakcie 2 z 3) → F5 → **Oczekiwanie**: przywrócenie ćwiczenia 2 z 3 (opcjonalnie — do decyzji, czy warto).
4. Sprawdź, że po kliknięciu "Wróć do dashboardu" → localStorage jest czysty i ciastko usunięte.
