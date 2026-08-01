# Prompt: Tworzenie GitHub Issues z Roadmapy PomoStretch

## Kontekst

Mam gotową roadmapę MVP projektu PomoStretch w pliku `context/foundation/roadmap.md`. Zawiera ona 6 milestones (M0-M6) z pełnymi specyfikacjami:
- M0: Auth Foundation (✅ gotowe)
- M1: Database Schema & Exercise Catalog
- M2: Pomodoro Timer
- M3: Break Input & Keyword Matching
- M4: Exercise Selection & Sequence
- M5: Break History CRUD
- M6: Testing & Certification

Każdy milestone ma:
- **Outcome** (co zostanie dostarczone)
- **Acceptance Criteria** (lista checkboxów definiująca "done")
- **Dependencies** (od czego zależy, co blokuje)
- **Risks** (tabela ryzyk z mitigacjami)
- **Estimated Effort** (3-8h)
- Pełną specyfikację techniczną

## Zadanie

Użyj **GitHub CLI** (`gh`) do utworzenia GitHub issues dla każdego milestone'a (M1-M6), aby roadmapa stała się publicznym, namacalnym backlogiem widocznym dla osób spoza zespołu.

## Wymagania

### 1. Struktura Issue

Dla każdego milestone'a (M1 przez M6) utwórz issue z:

**Tytuł**: Skopiuj z nagłówka milestone'a (np. "M1: Database Schema & Exercise Catalog")

**Opis** powinien zawierać:
```markdown
## Outcome
[Tekst z sekcji ### Outcome danego milestone'a]

## PRD References
[Wyciągnij z sekcji "PRD coverage:" w metadanych milestone'a, np. "FR-005 through FR-009"]

## Dependencies
**Depends on**: [lista milestone'ów które muszą być zakończone przed tym]
**Blocks**: [lista milestone'ów które to blokuje]

## Acceptance Criteria
[Skopiuj listę checkboxów z sekcji ### Acceptance Criteria]

## Risks
[Skopiuj tabelę z sekcji ### Risks, jeśli istnieje]

## Estimated Effort
[Wartość z kolumny "Estimated Effort" z Milestone Overview]

---
📋 Full spec: `context/foundation/roadmap.md` section `## M[N]: [Name]`
```

### 2. Labels

Dodaj do każdego issue odpowiednie labele:

- **M0** (Auth Foundation): `foundation`, `complete` (bo już gotowe)
- **M1** (Database Schema): `foundation`, `horizontal`, `database`
- **M2** (Pomodoro Timer): `feature`, `vertical`, `ui`
- **M3** (Break Input): `feature`, `vertical`, `ui`
- **M4** (Exercise Selection): `feature`, `vertical`, `core` (to realizuje US-01)
- **M5** (Break History CRUD): `feature`, `vertical`, `certification`
- **M6** (Testing): `testing`, `cross-cutting`

Dodatkowo dla wszystkich (poza M0): `mvp`

### 3. Milestone i Priorytet

- Jeśli w repo istnieje GitHub Milestone "MVP v1" — przypisz wszystkie issues do niego
- Jeśli nie istnieje — utwórz go najpierw: `gh api repos/{owner}/{repo}/milestones -f title="MVP v1" -f description="First certifiable MVP - US-01 end-to-end"`
- **Priority**: M1 i M2 mają najwyższy priorytet (można zacząć równolegle), potem M3→M4→M5→M6

### 4. Dependency Tracking

GitHub nie ma wbudowanego dependency graphu, ale można to zaznaczyć:
- W opisie każdego issue dodaj linki do zależności: "Depends on #[numer] #[numer]"
- Gdy utworzysz issue, zapisz sobie numery, żeby móc je wstawić do kolejnych

Alternatywnie: użyj task lists w body do trackowania zależności:
```markdown
## Prerequisites
- [ ] #[numer] M1: Database Schema (jeśli zależy od M1)
```

### 5. Commands

Użyj GitHub CLI. Przykładowy flow:

```bash
# 1. Upewnij się że jesteś w repo
cd mvp-pomostretch

# 2. Sprawdź czy jesteś zalogowany do gh
gh auth status

# 3. Utwórz milestone (jeśli nie istnieje)
gh api repos/Michal3run/mvp-pomostretch/milestones -f title="MVP v1" -f description="First certifiable MVP - US-01 end-to-end" -f due_on="2026-07-31T23:59:59Z"

# 4. Dla każdego milestone'a:
gh issue create \
  --title "M1: Database Schema & Exercise Catalog" \
  --body-file m1-issue-body.md \
  --label "mvp,foundation,horizontal,database" \
  --milestone "MVP v1"

# (Powtórz dla M2-M6)
```

### 6. Co zrobić z M0?

M0 (Auth Foundation) jest już **complete**. Możesz:
- Albo pominąć (nie tworzyć issue bo już zrobione)
- Albo utworzyć i od razu zamknąć z `--label complete` dla kompletności backlogu

## Oczekiwany Rezultat

Po wykonaniu powinieneś mieć:
- 6 issues w repo (lub 7 jeśli dodasz M0)
- Wszystkie przypisane do milestone'a "MVP v1"
- Dependency chain widoczny w opisach lub task listach
- Backlog widoczny publicznie w zakładce Issues
- Można teraz przekazać komuś link do Issues i powiedzieć "to jest nasza roadmapa"

## Pytania Które Możesz Mieć

**Q: Czy nie jest za wcześnie na issues, skoro kod jeszcze nie istnieje?**  
A: Nie — issues to plan pracy, nie bug reporty. Wiele zespołów tworzy issues na początku sprintu, przed rozpoczęciem kodowania. To Ci da widoczność postępu.

**Q: Co z "## Slices" sekcją?**  
A: Roadmapa nie ma sekcji "Slices" — zamiast tego ma "Milestones" (M1-M6). To jest poprawne mapowanie: każdy milestone = jeden vertical slice (lub bounded horizontal jak M1).

**Q: Czy mam commitować pliki markdown z body issues?**  
A: Nie, możesz je wygenerować on-the-fly lub trzymać w `/tmp`. Jedyne źródło prawdy to `roadmap.md`, issues to tylko widok publiczny.

## Dodatkowe Wskazówki

- Przeczytaj najpierw cały `context/foundation/roadmap.md`, żeby zrozumieć zależności
- Sekcja "## Dependency Graph" (ASCII diagram) pokazuje graficznie co od czego zależy
- Sekcja "## Milestone Overview" (tabela) to TL;DR każdego milestone'a
- Każda pełna specyfikacja to sekcja `## M[N]: [Name]`
- Upewnij się że masz dostęp do repo przez `gh` — repo to `Michal3run/mvp-pomostretch`

---

**Uwaga**: Jeśli nie masz pewności jak coś zrobić, zapytaj PRZED utworzeniem issues. Usunięcie źle utworzonych issues to spam w notyfikacjach dla watchers.
