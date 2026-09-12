# Plan Implementacji: Core Clean Code Refactor (`core-refactor`)

## Podsumowanie zmian

1. **Rule Engine Pipeline**:
   - Refaktoring `src/lib/rule-engine.ts` z eliminacją zagnieżdżonych `if/else` na rzecz czytelnego pipeline'u selekcji (`resolveCandidatesWithFallbacks`).
   - Wprowadzenie algorytmu Fishera-Yatesa do tasowania ćwiczeń.
   - Dodanie testów jednostkowych dla każdego poziomu kaskady fallbacków w `src/lib/rule-engine.test.ts`.

2. **ExerciseSequence Hook & Time Utils**:
   - Utworzenie `src/lib/time-utils.ts` i `src/lib/time-utils.test.ts` (test-first: `formatDuration`).
   - Konsolidacja `FALLBACK_EXERCISE_CATALOG` w `src/lib/exercise-catalog.ts`.
   - Usunięcie martwego stanu `_exerciseResults` / interfejsu `ExerciseResult`.
   - Utworzenie `src/components/hooks/useExerciseSequence.ts` (enkapsulacja stanu, storage, timerów i API).
   - Refaktoring `src/components/ExerciseSequence.tsx` do czystego widoku presentation layer (< 160 linii).

---

## Phase 1: Rule Engine Fallback Pipeline & Fisher-Yates Shuffler

### Changes Required:

1. **`src/lib/rule-engine.ts`**:
   - Zastąpić `candidates.sort(() => 0.5 - Math.random())` funkcją `fisherYatesShuffle<T>(items: readonly T[]): T[]`.
   - Zastąpić zagnieżdżone `if`y czytelną kaskadą funkcji fallbackowych:
     - Krok 1: Tag-matching bez powtórzeń (`matching && !lastSession`)
     - Krok 2: Tag-matching z powtórzeniami (`matching`)
     - Krok 3: Fallback 'general' bez powtórzeń (`general && !lastSession`)
     - Krok 4: Fallback 'general' z powtórzeniami (`general`)
     - Krok 5: Awaryjny katalog ogólny (`catalog`)
2. **`src/lib/rule-engine.test.ts`**:
   - Uzupełnić testy o weryfikację każdego poziomu fallbacku, zachowania przy pustym katalogu oraz tasowania.

### Success Criteria:

- Unit testy `src/lib/rule-engine.test.ts` przechodzą na zielono: `npm test`
- Brak zagnieżdżeń warunkowych powyżej 1 poziomu w silniku reguł
- Linter przechodzi bez błędów: `npm run lint`

---

## Phase 2: ExerciseSequence Hook & Time Utils Refactoring

### Changes Required:

1. **`src/lib/time-utils.ts` & `src/lib/time-utils.test.ts`**:
   - Utworzyć funkcję `formatDuration(seconds: number): string` formatującą sekundy na format `MM:SS`.
   - Napisać test-first przypadki testowe dla 0s, 5s, 59s, 60s, 125s itp.
2. **Konsolidacja danych domenowych i porządki**:
   - Skonsolidować `FALLBACK_EXERCISE_CATALOG` w `src/lib/exercise-catalog.ts` i zaimportować w hooku.
   - Usunąć nieużywany stan `_exerciseResults` i interfejs `ExerciseResult`.
3. **`src/components/hooks/useExerciseSequence.ts`**:
   - Wyekstrahować hook zarządzający stanem sekwencji, timera, przejść oraz integracji z API (`/api/session-history`, `/api/clear-break-cookie`).
4. **`src/components/ExerciseSequence.tsx`**:
   - Podpiąć `useExerciseSequence` i `formatDuration`.
   - Zredukować objętość pliku do czystego szablonu JSX (< 160 linii).

### Success Criteria:

- Testy `time-utils.test.ts` przechodzą na zielono: `npm test`
- `ExerciseSequence.tsx` ma poniżej 160 linii kodu: `wc -l src/components/ExerciseSequence.tsx`
- Pełny zestaw testów `npm test` przechodzi na zielono bez regresji
- Linter przechodzi bez błędów: `npm run lint`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Rule Engine Fallback Pipeline & Fisher-Yates Shuffler

#### Automated

- [x] 1.1 Unit testy `src/lib/rule-engine.test.ts` przechodzą na zielono: `npm test`
- [x] 1.2 Brak zagnieżdżeń warunkowych powyżej 1 poziomu w silniku reguł
- [x] 1.3 Linter przechodzi bez błędów: `npm run lint`

### Phase 2: ExerciseSequence Hook & Time Utils Refactoring

#### Automated

- [x] 2.1 Testy `time-utils.test.ts` przechodzą na zielono: `npm test`
- [x] 2.2 `ExerciseSequence.tsx` ma poniżej 160 linii kodu: `wc -l src/components/ExerciseSequence.tsx`
- [x] 2.3 Pełny zestaw testów `npm test` przechodzi na zielono bez regresji
- [x] 2.4 Linter przechodzi bez błędów: `npm run lint`

### Addendum

- [x] Wydzielenie `break-input-parser.ts` i `break-input-keywords.ts`
