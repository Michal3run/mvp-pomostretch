# Plan Implementacji: Rozbudowa bazy ćwiczeń (x2), 6 kafelków i ilustracje SVG (`exercise-catalog-expansion`)

## Podsumowanie zmian

1. **Model domeny & API**: Rozszerzenie listy stref w bazie i regułach o `glutes_hips` oraz `wrists_hands` (oddzielenie od `general`), rozbudowa słownika NLP w `src/pages/api/break-input.ts` (w tym rozpoznawanie "dupa", "pośladki", "biodra", "nadgarstki").
2. **UI (`src/pages/break-input.astro`)**: Przebudowa z 4 niefunkcjonalnych kafelków na 6 ergonomicznych stref (Oczy, Kark, Lędźwie, Pośladki/biodra, Dłonie/ręce, Zaskocz mnie).
3. **Ilustracje SVG (`public/images/*.svg`)**: Przygotowanie 38 nowych wektorowych grafik 256x256 spójnych z minimalistycznym stylem (tło `#FAFAF7`, kontur `#2D3748`, turkusowy akcent `#4FB8A8`).
4. **Baza danych (Supabase Migration)**: Utworzenie nowej migracji `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql` dodającej 38 nowych ćwiczeń z bezpiecznym `WHERE NOT EXISTS`, podnosząc bazę do 73 pozycji.
5. **Fallback Catalog (`src/lib/exercise-catalog.ts`)**: Uzupełnienie lokalnego katalogu awaryjnego o nowe kategorie.
6. **Testy jednostkowe i E2E**: Testy reguł i parsera słów kluczowych (`rule-engine.test.ts`), testy kompatybilności E2E (`tests/e2e/us-01.spec.ts`).

---

## Faza 1: Rozszerzenie taksonomii i parsowania języka naturalnego (NLP)

- Zaktualizować `src/pages/api/break-input.ts`:
  - Dodać obsługę `glutes_hips`: `textLower.includes("dupa") || textLower.includes("dupy") || textLower.includes("tyłek") || textLower.includes("poślad") || textLower.includes("poslad") || textLower.includes("biodr") || textLower.includes("gruszkowat") || textLower.includes("kulszow") || textLower.includes("rwa") || textLower.includes("butt") || textLower.includes("glute") || textLower.includes("hip")`
  - Dodać obsługę `wrists_hands`: `textLower.includes("nadgarst") || textLower.includes("dłoń") || textLower.includes("dlon") || textLower.includes("palc") || textLower.includes("ręk") || textLower.includes("rece") || textLower.includes("przedrami") || textLower.includes("cieśn") || textLower.includes("ciesn") || textLower.includes("myszk") || textLower.includes("klawiatur") || textLower.includes("wrist") || textLower.includes("hand")`
  - Rozszerzyć `lower_back`: `lędźw`, `ledzw`, `krzyż`, `krzyz`, `dół pleców`, `dol plecow`, `plecy`, `kręgosłup`
  - Zmapować "Zaskocz mnie" na tag `random` (obsługiwany bezpośrednio w `rule-engine.ts`), zamiast wrzucać do `general`.
- Dodać unit testy w `src/lib/rule-engine.test.ts` weryfikujące:
  - Dobór ćwiczeń dla tagu `glutes_hips`
  - Dobór ćwiczeń dla tagu `wrists_hands`
  - Obsługę fallbacków i tagu `random`

---

## Faza 2: Redesign ekranu wyboru strefy (`src/pages/break-input.astro`)

- Zastąpić obecny 4-przyciskowy grid nowym responsywnym układem **6 kafelków**:
  1. `Oczy i wzrok` (`value="Tylko oczy"`) -> tag `eyes`
  2. `Kark i szyja` (`value="Tylko kark"`) -> tag `neck` (zachowujemy `value="Tylko kark"` dla zgodności z `tests/e2e/us-01.spec.ts`)
  3. `Lędźwie i plecy` (`value="Lędźwie i plecy"`) -> tag `lower_back`
  4. `Pośladki i biodra` (`value="Pośladki i biodra"`) -> tag `glutes_hips`
  5. `Dłonie i nadgarstki` (`value="Dłonie i nadgarstki"`) -> tag `wrists_hands`
  6. `Zaskocz mnie` (`value="Zaskocz mnie"`) -> tag `random`
- Poprawić ergonomię wizualną kafelków: subtelne ikony/emotikony lub czytelne podtytuły, równe wysokości, focus ringi, obsługa klawiatury (dostępność WCAG).

---

## Faza 3: Generowanie 38 grafik wektorowych SVG

> **UWAGA DLA AGENTA (Podział sesji):** Ta faza jest bardzo obciążająca kontekst (creative work, Lesson L2). Nie realizuj tej fazy podczas głównej implementacji. Grafiki SVG powstaną w odrębnej sesji agenta z lepszym modelem wizualnym. Zostaw te zadania odznaczone w Progress, dopóki osobna sesja graficzna ich nie wykona.

- Przygotować 38 spójnych estetycznie wektorów SVG w katalogu `public/images/`:
  - 12 grafik dla pośladków/bioder (m.in. `seated-figure-4-deep.svg`, `glute-squeezes.svg`, `desk-lunge.svg`, `seated-butterfly.svg`, `desk-assisted-squat.svg`, `standing-hip-abduction.svg`, `standing-it-band-stretch.svg`, itp.)
  - 8 grafik dla dłoni i nadgarstków (m.in. `reverse-prayer-stretch.svg`, `prayer-stretch.svg`, `ulnar-nerve-glide.svg`, `hand-wrist-shake.svg`, `finger-fan.svg`, `wrist-figure-8.svg`, `thenar-massage.svg`, `desk-finger-pushups.svg`)
  - 6 grafik dla lędźwi (m.in. `standing-mckenzie-extension.svg`, `chair-pushup-decompression.svg`, `pelvic-clock-tilts.svg`, `supported-forward-fold.svg`, `seated-lat-reach.svg`, `cross-leg-spinal-twist.svg`)
  - 5 grafik dla karku (m.in. `suboccipital-release.svg`, `ear-shoulder-reach.svg`, `isometric-neck-stabilization.svg`, `cervical-retraction.svg`, `over-shoulder-look.svg`)
  - 4 grafiki dla klatki i barków (m.in. `chest-expansion-clasp.svg`, `seated-w-to-y.svg`, `desk-puppy-sink.svg`, `cross-body-deltoid.svg`)
  - 3 grafiki dla oczu i oddechu (m.in. `brow-pinch-release.svg`, `eye-shapes-clock.svg`, `parasympathetic-breath-478.svg`)
- Zweryfikować, że każdy plik jest poprawnym XML/SVG i nie przekracza 1.5 KB.

---

## Faza 4: Migracja SQL powiększająca bazę do 73 ćwiczeń

- Utworzyć plik migracji `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql`:
  - Zaktualizować istniejące ćwiczenia nadgarstków z `ARRAY['general']` na `ARRAY['wrists_hands', 'general']`, a ćwiczenia pośladkowe/biodrowe na `ARRAY['glutes_hips', 'lower_back']`.
  - Dodać 38 nowych rekordów z unikalnymi nazwami, profesjonalnymi opisami fizjoterapeutycznymi (pozycja, ruch, oddech, ostrzeżenie), czasami trwania (30–90 s) oraz ścieżkami do `images/*.svg`.
  - Zapewnić pełną idempotencję (`WHERE NOT EXISTS (SELECT 1 FROM public.exercise e WHERE e.name = v.name)`).
- Zaktualizować `src/lib/exercise-catalog.ts` (fallback offline), dodając reprezentantów nowych stref.

---

## Faza 5: Weryfikacja i testy

- Uruchomić `npm run lint` i upewnić się, że nie ma błędów lintera/formatowania.
- Uruchomić testy jednostkowe `npm test`.
- Przetestować scenariusz użytkownika:
  - Wpisanie _"boli mnie dupa"_ -> sprawdzenie czy generuje wyłącznie ćwiczenia pośladków/bioder.
  - Kliknięcie każdego z 6 kafelków -> sprawdzenie poprawności przypisanych ćwiczeń.
  - Sprawdzenie wyświetlania obrazka dla każdego ćwiczenia (brak placeholderów/fallbacków).
- Uruchomić testy Playwright E2E (`npx playwright test`).

## Progress

### Faza 1: Rozszerzenie taksonomii i parsowania języka naturalnego (NLP)

- [x] Zaktualizować `src/pages/api/break-input.ts` — 89ded69
- [x] Dodać unit testy w `src/lib/rule-engine.test.ts` weryfikujące — 89ded69

### Faza 2: Redesign ekranu wyboru strefy (src/pages/break-input.astro)

- [x] Zastąpić obecny 4-przyciskowy grid nowym responsywnym układem **6 kafelków**: — 691db2f
- [x] Poprawić ergonomię wizualną kafelków: subtelne ikony/emotikony lub czytelne podtytuły, równe wysokości, focus ringi, obsługa klawiatury (dostępność WCAG). — 691db2f

### Faza 3: Generowanie 38 grafik wektorowych SVG

- [ ] Przygotować 38 spójnych estetycznie wektorów SVG w katalogu `public/images/`:
- [ ] Zweryfikować, że każdy plik jest poprawnym XML/SVG i nie przekracza 1.5 KB.

### Faza 4: Migracja SQL powiększająca bazę do 73 ćwiczeń

- [ ] Utworzyć plik migracji `supabase/migrations/20260910220000_expand_exercise_catalog_x2.sql`:
- [ ] Zaktualizować `src/lib/exercise-catalog.ts` (fallback offline), dodając reprezentantów nowych stref.

### Faza 5: Aktualizacja E2E i weryfikacja

- [x] Zaktualizować mocki/stany w `tests/e2e/us-01.spec.ts` (test sprawdzający przycisk "Tylko kark" powinien nadal przechodzić).
- [x] Dodać nowy test w Playwright sprawdzający, czy przycisk "Zaskocz mnie" poprawnie prosi o tag `random` lub przepuszcza z odpowiednim query.
- [x] Uruchomić weryfikację końcową:
  - `npm run lint`
  - `npm test`
  - `npx playwright test`
