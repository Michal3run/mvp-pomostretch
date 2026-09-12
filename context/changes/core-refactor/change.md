---
change_id: core-refactor
title: Core Refactor (Rule Engine Fallback Pipeline & ExerciseSequence Custom Hook)
status: impl_reviewed
created: 2026-09-11
updated: 2026-09-12
owner: solo
type: refactoring
blocks_certification: false
---

# Change: Core Refactor — Rule Engine Pipeline & ExerciseSequence Hook

> **One-line summary.** Głęboki refaktoring jakościowy (Clean Code & Senior JS/TS) dwóch najbardziej obciążonych obszarów logiki w projekcie: silnika doboru ćwiczeń (`rule-engine.ts`) z eliminacją drabinki `if/else` i wprowadzeniem czystego pipeline fallbacków oraz komponentu `ExerciseSequence.tsx` (453 linie) poprzez wydzielenie custom hooka `useExerciseSequence` i `time-utils`.

---

## 1. Motywacja i diagnoza problemu

Przed finalnym oddaniem projektu MVP, audyt kodu ujawnił dwa kluczowe długi architektoniczne:

1. **`src/lib/rule-engine.ts`**:
   - 5-etapowa kaskada fallbacków z 3-poziomowym zagnieżdżeniem if/else (`candidates` -> `freshCandidates` -> `generalCandidates` -> `freshGeneral` -> `catalog`).
   - Losowanie oparte o `sort(() => 0.5 - Math.random())`, będące znanym anty-wzorcem w JavaScript (niezapewniającym równego prawdopodobieństwa permutacji).
2. **`src/components/ExerciseSequence.tsx`**:
   - Monolityczny komponent React mający 453 linie kodu.
   - Naruszenie wytycznej z `AGENTS.md`: _"Extract hooks to src/components/hooks/"_.
   - Mieszanie w widoku JSX logiki dwóch timerów (aktywnego ćwiczenia i przerwy bezczynności), synchronizacji ze storage, wywołań HTTP do API (`/api/session-history`, `/api/clear-break-cookie`) oraz formatowania czasu.

---

## 2. Zakres refaktoringu

### Faza 1: Silnik doboru ćwiczeń (`src/lib/rule-engine.ts`)

- Wdrożenie czystego pipeline'u kaskady fallbacków (sekwencja funkcji ewaluujących kandydatów).
- Zastąpienie losowego sortowania deterministycznym, poprawnym algorytmem Fishera-Yatesa (`shuffleArray`).
- Wzmocnienie testów jednostkowych o pokrycie każdego szczebla kaskady fallbacków.

### Faza 2: Dekompozycja `ExerciseSequence.tsx` (Custom Hook + Utility)

- Wydzielenie `src/lib/time-utils.ts` (`formatDuration`) wraz z dedykowanymi testami jednostkowymi.
- Utworzenie `src/components/hooks/useExerciseSequence.ts` zarządzającego pełnym cyklem życia sekwencji (timery, przejścia stanów, storage, raportowanie do API).
- Odchudzenie `ExerciseSequence.tsx` do czytelnego komponentu prezentacyjnego (~120-150 linii).

---

## 3. Kryteria sukcesu

- `npm test` przechodzi w 100% na zielono bez regresji.
- `npm run lint` bez błędów.
- Komponent `ExerciseSequence.tsx` nie przekracza 160 linii.
- Logika timerów i formatowania czasu pokryta w 100% testami jednostkowymi.
