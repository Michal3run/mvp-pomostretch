# Prompt: Generowanie Body dla GitHub Issues (bez gh CLI)

## Kontekst

Projekt: PomoStretch MVP  
Roadmapa: `mvp-pomostretch/context/foundation/roadmap.md`  
Repo: https://github.com/Michal3run/mvp-pomostretch

## Zadanie

Wygeneruj **6 plików markdown** z body dla GitHub issues (M1-M6). Użytkownik potem skopiuje je ręcznie do GitHub UI lub użyje API.

## Format każdego pliku

Dla każdego milestone'a (M1 przez M6) utwórz plik `m[N]-issue.md`:

### Struktura

```markdown
## 🎯 Outcome

[Skopiuj tekst z sekcji "### Outcome" danego milestone'a z roadmap.md]

## 📋 PRD References

[Wyciągnij z metadanych milestone'a pole "PRD coverage"]

## 🔗 Dependencies

**Depends on:**

- [Lista milestone'ów które muszą być zakończone przed tym - linki będą dodane ręcznie po utworzeniu issues]

**Blocks:**

- [Lista milestone'ów które to blokuje]

## ✅ Acceptance Criteria

[Skopiuj listę checkboxów z sekcji "### Acceptance Criteria" - zachowaj format `- [ ]`]

## ⚠️ Risks

[Skopiuj tabelę z sekcji "### Risks" jeśli istnieje, w formacie markdown]

## ⏱️ Estimated Effort

**[Wartość z kolumny "Estimated Effort" z Milestone Overview, np. "3-4 hours"]**

---

📖 **Full specification**: [`context/foundation/roadmap.md` → `## M[N]`](https://github.com/Michal3run/mvp-pomostretch/blob/main/context/foundation/roadmap.md#m[N]-[slug])

**Labels**: `mvp`, `[type]`, `[category]`  
**Milestone**: MVP v1  
**Priority**: [określ na podstawie dependency graph]
```

## Mapowanie Labels

Dla każdego milestone'a określ jakie labels:

- **M1**: `mvp`, `foundation`, `horizontal`, `database`
- **M2**: `mvp`, `feature`, `vertical`, `ui`, `timer`
- **M3**: `mvp`, `feature`, `vertical`, `ui`, `input`
- **M4**: `mvp`, `feature`, `vertical`, `core`, `us-01`
- **M5**: `mvp`, `feature`, `vertical`, `crud`, `certification`
- **M6**: `mvp`, `testing`, `cross-cutting`, `deployment`

## Priority Mapping

Na podstawie dependency graph z roadmap.md:

- **High priority**: M1, M2 (można zacząć równolegle, critical path)
- **Medium priority**: M3 (zależy od M2), M5 (zależy od M1)
- **Blocked**: M4 (zależy od M1+M3), M6 (zależy od M4+M5)

## Tytuły Issues

Dokładnie skopiuj nagłówki z roadmap.md:

1. `M1: Database Schema & Exercise Catalog`
2. `M2: Pomodoro Timer`
3. `M3: Break Input & Keyword Matching`
4. `M4: Exercise Selection & Sequence`
5. `M5: Break History CRUD`
6. `M6: Testing & Certification`

## Co zrobić z M0?

M0 (Auth Foundation) jest już complete (✅). Nie twórz dla niego issue, ale w M2 i M5 dependencies dodaj notatkę:

```markdown
**Depends on:**

- M0: Auth Foundation (✅ complete)
- [inne zależności]
```

## Output

Wygeneruj 6 plików:

- `m1-issue.md`
- `m2-issue.md`
- `m3-issue.md`
- `m4-issue.md`
- `m5-issue.md`
- `m6-issue.md`

Na końcu wygeneruj **skrócony setup guide**:

````markdown
# Setup Guide

## Opcja A: Ręcznie przez GitHub UI

1. Idź do https://github.com/Michal3run/mvp-pomostretch/issues/new
2. Dla każdego pliku m[N]-issue.md:
   - Tytuł: [skopiuj tytuł]
   - Body: [skopiuj całą zawartość pliku]
   - Labels: [dodaj listed labels]
   - Milestone: MVP v1 (utwórz najpierw jeśli nie istnieje)
3. Po utworzeniu wszystkich, edytuj każde i zamień placeholders [Link to #...] na prawdziwe numery issues

## Opcja B: Przez GitHub API (jeśli masz token)

```bash
# Utwórz token: https://github.com/settings/tokens
# Scope: repo

export GITHUB_TOKEN="twoj_token_tutaj"

for i in {1..6}; do
  curl -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/Michal3run/mvp-pomostretch/issues \
    -d @m${i}-issue.json
done
```
````

(Będziesz musiał przekonwertować .md na .json format)

```

```

## Ważne Notatki

1. **Dependency links**: Po utworzeniu issues musisz ręcznie edytować je i zamienić placeholders typu "M1: Database Schema" na linki `#[numer]`

2. **Milestone MVP v1**: Jeśli nie istnieje, utwórz go najpierw:
   - Idź do https://github.com/Michal3run/mvp-pomostretch/milestones
   - New milestone → Title: "MVP v1", Due: 2026-07-31
3. **Kolejność tworzenia**: Twórz w kolejności M1→M2→M3→M4→M5→M6, żeby numerki issues były w sensownej kolejności

## Co mam zrobić?

Przeczytaj `mvp-pomostretch/context/foundation/roadmap.md` szczegółowo i wygeneruj te 6 plików. Dla każdego milestone'a znajdziesz pełną specyfikację w sekcji `## M[N]: [Name]`.

**Sekcje w roadmap.md które Cię interesują**:

- `## Milestone Overview` (tabela z effort estimates)
- `## Dependency Graph` (ASCII diagram pokazujący zależności)
- `## M1: Database Schema...` aż do `## M6: Testing...` (pełne specyfikacje)

**Nie modyfikuj treści** - tylko skopiuj relevantne sekcje do struktury issue body powyżej.
