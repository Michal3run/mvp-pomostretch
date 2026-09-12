---
change_id: exercise-catalog-expansion
status: archived
created: 2026-09-10
updated: 2026-09-12
archived_at: 2026-09-12T20:20:32Z
owner: solo
type: feature
blocks_certification: false
related_prd_sections:
  - "## Functional Requirements / Break Input & Exercise Catalog"
  - "## Ergonomics & Physiotherapy Domain Model"
related_frs: [FR-011, FR-012, FR-013, FR-020, FR-021, FR-022]
---

# Change: Rozbudowa bazy ćwiczeń (x2), kafelki 6 stref bólu i ilustracje SVG (`exercise-catalog-expansion`)

> **Krótkie podsumowanie (One-line summary).** Podwojenie bazy ćwiczeń z 35 do 70+ pozycji opracowanych z perspektywy fizjoterapii osób siedzących, zastąpienie 4 kafelków 6 ergonomicznymi strefami bólu (w tym kluczowe: pośladki/biodra, lędźwie, dłonie), naprawa parsowania języka naturalnego (rozpoznawanie m.in. "boli mnie dupa", "rwa", "kulszowa") oraz zaplanowanie dedykowanych ilustracji SVG dla każdego ćwiczenia.

---

## 1. Diagnoza problemu i motywacja

### Dlaczego zapytanie "boli mnie dupa" pokazywało ćwiczenia na nadgarstki?

1. **Brak mapowania słów kluczowych**: W `src/pages/api/break-input.ts` parser sprawdzał wyłącznie 4 sztywne grupy: `eyes`, `neck`, `shoulders`, `lower_back`. Słowa takie jak _"dupa"_, _"pośladki"_, _"biodra"_, _"miednica"_, _"kulszowa"_ nie były zmapowane na żadną strefę.
2. **Fallback do `general`**: Gdy parser nie wykryje słów, przypisuje domyślny tag `tags = ["general"]`.
3. **Zanieczyszczenie kategorii `general`**: W bazie danych (`supabase/migrations/20260802110000_add_exercise_image_and_seed.sql`) ćwiczenia dłoni i nadgarstków (np. _Rozciąganie nadgarstków_, _Mobilizacja nerwu nadgarstka_, _Gimnastyka ścięgien palców_) miały przypisany tag `general` zamiast odrębnej kategorii. W efekcie użytkownik zgłaszający ból pośladków trafiał do worka ogólnego, z którego losowane były ćwiczenia na nadgarstki.
4. **Zbyt mała baza (35 ćwiczeń)**: W niektórych strefach było zaledwie 2-5 ćwiczeń. Przy losowaniu 3 ćwiczeń na przerwę i filtrze no-repeat zapamiętującym tylko 1 sesję wstecz, ćwiczenia powtarzały się niemal w co drugiej przerwie.

### Niefunkcjonalne 4 kafelki na ekranie wyboru

Aktualnie na `src/pages/break-input.astro` znajdują się 4 przyciski:

- _"Tylko oczy"_
- _"Tylko kark"_
- _"Ogólne"_
- _"Zaskocz mnie"_

W kodzie API zarówno _"Ogólne"_, jak i _"Zaskocz mnie"_ dodawały do zbioru ten sam tag: `tagSet.add("general")`. Użytkownik widział dwa przyciski robiące dokładnie to samo. Co ważniejsze, pominięte zostały obszary generujące 70% dyskomfortu u programistów: **lędźwie**, **pośladki/biodra** oraz **dłonie/nadgarstki**.

---

## 2. Perspektywa fizjoterapeuty i trenera: Co naprawdę boli pracownika biurowego?

Siedzący tryb pracy (8-12h dziennie) wywołuje charakterystyczne zespoły przeciążeniowe łańcucha biokinematycznego:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PATOANATOMIA BIURA                         │
├────────────────────────────────┬────────────────────────────────┤
│ Zespół skrzyżowania górnego   │ Zespół skrzyżowania dolnego    │
│ (Upper Crossed Syndrome)       │ (Lower Crossed Syndrome)       │
├────────────────────────────────┼────────────────────────────────┤
│ • Wysunięta głowa (Tech Neck)  │ • Przodopochylenie miednicy    │
│ • Przykurcz m. czworobocznego  │ • Przykurcz zginaczy bioder    │
│ • Osłabione zginacze głębokie  │ • Wyłączenie/amnezja pośladków │
│ • Zapadnięta klatka piersiowa  │ • Kompresja krążków L4-S1      │
└────────────────────────────────┴────────────────────────────────┘
```

### Analiza 6 kluczowych stref bólu:

1. **Pośladki i biodra (`glutes_hips`) — syndrom "Boli mnie dupa" / Dead Butt Syndrome**:
   - _Mechanizm_: Długotrwały ucisk na mięśnie pośladkowe wielkie i średnie powoduje ich niedotlenienie i neurologiczną "amnezję". Przykurczony mięsień gruszkowaty uciska nerw kulszowy (zespół m. gruszkowatego, rzekoma rwa kulszowa).
   - _Co pomaga_: "Czwórka" (seated figure-4 / gołąb w siadzie), aktywacja izometryczna pośladków, rozciąganie zginaczy bioder w wykroku, otwieranie bioder (motyl na krześle), głęboki przysiad z asystą biurka.
2. **Lędźwie i kręgosłup (`lower_back`)**:
   - _Mechanizm_: Zgięciowa pozycja siedząca znosi lordozę lędźwiową, zwiększając ciśnienie wewnątrzdyskowe o 40-90% względem stania.
   - _Co pomaga_: Wyprosty w staniu (protokół McKenziego), dekompresja osiowa kręgosłupa (odciążenie na poręczach/biurku), rotacje lędźwiowo-miedniczne, koci grzbiet.
3. **Dłonie, nadgarstki i przedramiona (`wrists_hands`) — RSI & Cieśń**:
   - _Mechanizm_: Setki tysięcy mikroruchów myszą i klawiaturą, ciągłe zgięcie grzbietowe i pronacja przedramienia.
   - _Co pomaga_: Rozciąganie zginaczy i prostowników ("modlitwa"), neurodynamika (ślizg nerwu pośrodkowego i łokciowego), potrząsanie dłońmi, rozluźnianie kłębu kciuka.
4. **Kark i szyja (`neck`)**:
   - _Mechanizm_: Każde 2.5 cm wysunięcia głowy w przód podwaja obciążenie karku (nawet 20-27 kg na C7).
   - _Co pomaga_: Retrakcja głowy (chin tucks), rozciąganie m. dźwigacza łopatki i czworobocznego, automasaż podpotyliczny.
5. **Oczy i wzrok (`eyes`) — Asthenopia / CVS**:
   - _Mechanizm_: Spadek częstości mrugania z 18 do 4 razy na minutę, skurcz mięśnia rzęskowego.
   - _Co pomaga_: Reguła 20-20-20, palming (ciepło dłoni), wodzenie po ósemce, zmiana akomodacji blisko-daleko.
6. **Barki i klatka piersiowa (`shoulders_chest`)**:
   - _Mechanizm_: Zamknięta klatka, protrakcja barków, spłycony oddech.
   - _Co pomaga_: Otwarcie klatki w drzwiach, wyprost na oparciu krzesła, ściąganie łopatek.

---

## 3. Nowy ekran wyboru: 6 intuicyjnych kafelków

Zastępujemy 4 kafelki układem **6 czytelnych kafelków** w responsywnym gridzie (2 kolumny na mobile, 3 kolumny na desktopie):

| Kafelek | Etykieta w UI         | Ikona / Podtytuł       | Przekazywany tag | Opis dla leniwego usera                   |
| :------ | :-------------------- | :--------------------- | :--------------- | :---------------------------------------- |
| 1       | **Oczy i wzrok**      | 👁️ Zmęczenie ekranem   | `eyes`           | Ulga dla przesuszonych, piekących oczu    |
| 2       | **Kark i szyja**      | 🦒 Sztywny kark        | `neck`           | Rozluźnienie szyi i podstawy czaszki      |
| 3       | **Lędźwie i plecy**   | 🪑 Dół pleców          | `lower_back`     | Odciążenie zablokowanego kręgosłupa       |
| 4       | **Pośladki i biodra** | 🍑 Od siedzenia        | `glutes_hips`    | Na "ból dupy", przykurcze i rwę           |
| 5       | **Dłonie i ręce**     | ✋ Myszka i klawiatura | `wrists_hands`   | Nadgarstki, przedramiona i palce          |
| 6       | **Zaskocz mnie**      | ⚡ Całe ciało          | `random`         | Prawdziwie losowy miks ze wszystkich grup |

_Uwaga wstecznej kompatybilności:_ Istniejące testy E2E (np. `getByRole("button", { name: "Tylko kark" })`) będą wspierane poprzez zachowanie alternatywnego dopasowania lub aktualizację selektorów testowych z zachowaniem reguł `/10x-e2e`.

---

## 4. Inteligentne parsowanie języka naturalnego (NLP)

W `src/pages/api/break-input.ts` rozbudowujemy słownik słów kluczowych o polskie odmiany i mowę potoczną:

- **`glutes_hips`**: `dupa`, `dupy`, `dupie`, `dupę`, `tyłek`, `tylka`, `poślad`, `posladk`, `biodr`, `biodro`, `biodra`, `gruszkowat`, `kulszow`, `rwa`, `siedzen`, `butt`, `glute`, `hip`, `piriformis`
- **`wrists_hands`**: `nadgarst`, `dłoń`, `dlon`, `dłoni`, `palc`, `ręk`, `rece`, `przedrami`, `cieśn`, `ciesn`, `myszk`, `klawiatur`, `wrist`, `hand`, `finger`, `forearm`
- **`lower_back`**: `lędźw`, `ledzw`, `krzyż`, `krzyz`, `dół pleców`, `dol plecow`, `plecy`, `kręgosłup`, `kregoslup`, `lower back`, `lumbar`
- **`neck`**: `kark`, `szyj`, `szyja`, `głow`, `glowa`, `potylic`, `czworoboczn`, `neck`, `cervical`
- **`eyes`**: `ocz`, `oczy`, `wzrok`, `ekran`, `piecz`, `łzaw`, `widzen`, `eye`, `vision`
- **`shoulders_chest`**: `bark`, `ramion`, `łopatk`, `lopatk`, `klatk`, `piersiow`, `garb`, `shoulder`, `chest`
- **`random`**: `zaskocz`, `losow`, `miks`, `random`, `dowoln`
- **`general`**: `ogóln`, `ogoln`, `wszystko`, `całe ciało`, `cale cialo`, `general`

Gdy użytkownik wpisze _"boli mnie dupa"_, otrzyma precyzyjnie tag `glutes_hips` i zestaw ćwiczeń na pośladki, biodra i m. gruszkowaty, a **nie** ćwiczenia nadgarstków!

---

## 5. Rozbudowa bazy ćwiczeń (35 -> 73 pozycje)

Projektujemy **38 nowych ćwiczeń** (wzrost o ponad 100%), wzbogacając każdą strefę o sprawdzone klinicznie techniki fizjoterapeutyczne:

### A. Pośladki i biodra (`glutes_hips`) — 12 nowych pozycji:

1. **Czwórka na krześle (Seated Figure-4)** — rozciąganie m. gruszkowatego w siadzie.
2. **Aktywacja pośladków (Glute Squeezes)** — izometryczne, rytmiczne spięcia pośladków przywracające ukrwienie.
3. **Wykrok biurowy (Desk Lunge)** — dynamiczne rozciąganie zginaczy bioder (m. biodrowo-lędźwiowy).
4. **Motyl na krześle (Seated Butterfly)** — otwieranie przywodzicieli i torebki stawu biodrowego.
5. **Odwodzenie nogi przy biurku (Standing Hip Abduction)** — aktywacja pośladkowego średniego.
6. **Głęboki przysiad z asystą biurka (Desk-Assisted Deep Squat)** — dekompresja miednicy i lędźwi.
7. **Rozciąganie pasma biodrowo-piszczelowego (Standing IT-Band Stretch)** — skrzyżowane nogi i skłon boczny.
8. **Krążenia kolan w siadzie (Seated Knee Circles)** — smarowanie maziowe panewki biodra.
9. **Kopnięcie w tył przy biurku (Standing Glute Kickback)** — wyprost biodra i pobudzenie pośladka wielkiego.
10. **Rozciąganie tyłu ud na krześle (Hamstring Chair Stretch)** — zgięcie w biodrze z prostym kolanem.
11. **Wypychanie bioder w staniu (Standing Pelvic Thrust & Reset)** — neutralizacja tyłopochylenia.
12. **Rozciąganie czwórogłowego przy biurku (Desk Quad Stretch)** — przyciągnięcie pięty do pośladka.

### B. Dłonie, nadgarstki i przedramiona (`wrists_hands`) — 8 nowych pozycji:

13. **Odwrócona modlitwa (Reverse Prayer Wrist Stretch)** — rozciąganie prostowników nadgarstka.
14. **Pozycja modlitewna (Prayer Stretch)** — rozciąganie zginaczy nadgarstka i dłoni.
15. **Ślizg nerwu łokciowego ("Okulary" / Ulnar Nerve Glide)** — neurodynamika dla łokcia i małego palca.
16. **Strząsanie napięcia (Hand & Wrist Shake)** — rozluźnienie powięziowe przedramion.
17. **Rozpieranie palców w powietrzu (Finger Fan & Resistance)** — wzmacnianie prostowników palców.
18. **Ósemki nadgarstków (Wrist Figure-8 Roll)** — splecione palce i płynna mobilizacja torebek stawowych.
19. **Masaż kłębu kciuka (Thenar Eminence Self-Massage)** — rozluźnienie mięśni chwytnych od smartfona/myszki.
20. **Pajączek na blacie (Desk Finger Push-Ups)** — izometryczne wzmocnienie łuków dłoni.

### C. Lędźwie i kręgosłup (`lower_back`) — 6 nowych pozycji:

21. **Wyprost w staniu wg McKenziego (Standing McKenzie Back Extension)** — repozycja jądra miażdżystego dysku.
22. **Dekompresja osiowa na fotelu (Chair Push-Up Decompression)** — podparcie na poręczach i zawieszenie tułowia.
23. **Kołyska miednicy w siadzie (Pelvic Clock / Tilts)** — płynne przodo- i tyłopochylenie miednicy.
24. **Szeroki skłon z podparciem o uda (Supported Forward Fold)** — bezpieczne rozciąganie powięzi piersiowo-lędźwiowej.
25. **Sięganie po skosie w siadzie (Seated Lat & Lower Back Reach)** — rozciąganie m. czworobocznego lędźwi.
26. **Skręt krzesełkowy noga na nogę (Cross-Leg Spinal Twist)** — mobilizacja rotacyjna segmentów Th12-L3.

### D. Kark i szyja (`neck`) — 5 nowych pozycji:

27. **Masaż punktów podpotylicznych (Suboccipital Release)** — ucisk kciukami podstawy czaszki przy bólach głowy.
28. **Skłon boczny z depresją łopatki (Ear to Shoulder with Arm Reach)** — rozciąganie m. dźwigacza łopatki.
29. **Izometryczny opór dłoni (Isometric Neck Stabilization)** — dłoń na czole/skroni bez ruchu głowy.
30. **Żółw i żyrafa (Cervical Retraction & Axial Elongation)** — elongacja osiowa kręgosłupa szyjnego.
31. **Spojrzenie za siebie z wydechem (Over-the-Shoulder Look)** — bezpieczna rotacja w pełnym zakresie.

### E. Klatka i barki (`shoulders_chest`) — 4 nowe pozycje:

32. **Splecione dłonie za plecami (Chest Expansion Clasp)** — otwarcie przykurczonych mięśni piersiowych.
33. **Wznosy ramion W-do-Y (Seated W-to-Y Raises)** — aktywacja dolnego czworobocznego i zębatego przedniego.
34. **Oparcie rąk o blat z opadem klatki (Desk Puppy Sink)** — otwarcie odcinka piersiowego i najszerszych grzbietu.
35. **Krzyżowe rozciąganie tyłu barku (Cross-Body Deltoid Stretch)** — rozluźnienie torebki tylnej stawu ramiennego.

### F. Oczy i układ nerwowy (`eyes` / `general`) — 3 nowe pozycje:

36. **Akupresura łuków brwiowych (Brow Pinch Release)** — stymulacja punktów oczodołowych.
37. **Geometryczne wodzenie wzrokiem (Eye Shapes & Clock)** — śledzenie krawędzi pokoju w celu rozluźnienia m. gałkoruchowych.
38. **Oddychanie 4-7-8 na krześle (4-7-8 Parasympathetic Breath)** — reset układu współczulnego obniżający napięcie mięśniowe.

---

## 6. Plan generowania i stylistyka wektorów SVG

Każde z 38 nowych ćwiczeń otrzyma dedykowany plik SVG w katalogu `public/images/`.

### Specyfikacja techniczna SVG:

- **Format i siatka**: `viewBox="0 0 256 256"`, `xmlns="http://www.w3.org/2000/svg"`
- **Tło**: `<rect width="256" height="256" fill="#FAFAF7"/>`
- **Linie anatomiczne**: `fill="none" stroke="#2D3748" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`
- **Wektor ruchu / Strefa skupienia**: Akcenty turkusowe PomoStretch: `stroke="#4FB8A8"` lub `fill="#4FB8A8"` (strzałki, łuki kierunkowe, zaznaczone stawy)
- **Minimalistyczny human-figure style**: Spójny z dotychczasowymi 23 plikami SVG w repozytorium (proste linie ciała, okrąg głowy r=20, schematyczne biurko/krzesło w razie potrzeby).

---

## 7. Weryfikacja i kryteria akceptacji

1. **Wpisanie "boli mnie dupa"**:
   - Zwraca strefę `glutes_hips`.
   - W sekwencji ćwiczeń pojawiają się wyłącznie ćwiczenia pośladków/bioder (np. _Czwórka na krześle_, _Wykrok biurowy_, _Aktywacja pośladków_).
   - Zero ćwiczeń na nadgarstki.
2. **Kafelki na ekranie `/break-input`**:
   - 6 kafelków w estetycznym, równym gridzie.
   - Kliknięcie dowolnego kafelka generuje zestaw ćwiczeń zgodny z wybraną strefą.
   - "Zaskocz mnie" generuje losowy zestaw z całego katalogu (`random`).
3. **Katalog bazy danych**:
   - Łączna liczba ćwiczeń w bazie: $\ge 70$.
   - Wszystkie ćwiczenia posiadają przypisany istniejący plik SVG w `public/images/`.
   - Żadne ćwiczenie nie renderuje błędu brakującej grafiki ("Brak ilustracji dla tego ćwiczenia").
4. **Testy regresji**:
   - `npm run lint` i `npm test` przechodzą na zielono.
   - Test E2E `tests/e2e/us-01.spec.ts` przechodzi bez zakłóceń.
