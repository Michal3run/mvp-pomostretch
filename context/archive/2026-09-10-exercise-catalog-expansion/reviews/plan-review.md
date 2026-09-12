<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Rozbudowa bazy ćwiczeń (x2), 6 kafelków i ilustracje SVG

- **Plan**: context/changes/exercise-catalog-expansion/plan.md
- **Mode**: Deep
- **Date**: 2026-09-11
- **Verdict**: SOUND
- **Findings**: 2 critical, 0 warnings, 0 observations

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS    |
| Lean Execution        | PASS    |
| Architectural Fitness | PASS    |
| Blind Spots           | FAIL    |
| Plan Completeness     | PASS    |

## Grounding

Grounding: 5/5 paths ✓, 1/1 symbols ✓, brief↔plan ✓

## Findings

### F1 — Missing Progress Section

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Entire document
- **Detail**: The plan is missing the mandatory `## Progress` block at the bottom, and uses `- [ ]` checkboxes inside the phase descriptions. The `/10x-implement` skill will fail to parse this plan.
- **Fix**: Move all checkboxes to a `## Progress` section at the end and convert phase lists to plain `- ` bullets.
- **Decision**: FIXED (Fix in plan)

### F2 — Generowanie 38 grafik SVG przez AI

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Lean Execution
- **Location**: Faza 3 i Faza 4
- **Detail**: Plan zakłada, że agent AI wygeneruje 38 poprawnych anatomicznie i spójnych wizualnie grafik SVG w jednej fazie implementacji. Zgodnie z AGENTS.md (L2), tworzenie katalogu ćwiczeń to "creative human work". Agent tekstowy nie jest w stanie wygenerować takich grafik wektorowych. Próba wykonania tego zakończy się serią błędów lub niskiej jakości zniekształconymi kodami SVG.
- **Fix A ⭐ Recommended**: Usuń fazę generowania SVG i użyj istniejących grafik.
  - Strength: Natychmiastowo wykonalne; używa grafik jako "placeholders" do momentu dostarczenia docelowych.
  - Tradeoff: Nowe ćwiczenia będą miały powtarzające się, mniej dokładne grafiki.
  - Confidence: HIGH — bezpieczne dla procesu implementacji przez agenta.
  - Blind spot: Może powodować konsternację użytkownika, jeśli ilustracja nie pasuje do opisu ćwiczenia.
- **Fix B**: Rozszerz bazę ćwiczeń bez wymagania obrazków, modyfikując schemat DB.
  - Strength: Zdejmuje całkowicie ciężar generowania obrazków z obecnego etapu.
  - Tradeoff: Wymaga zmiany typu pola `image` na nullable i ukrywania obrazków w UI.
  - Confidence: MEDIUM — wymaga sprawdzenia, czy UI (Astro) obsłuży poprawnie brak pola `image`.
  - Blind spot: Brak wiedzy o zależnościach frontendu od obecności obrazków.
- **Decision**: FIXED (Fix differently - podzielono plan na dwie sesje)
