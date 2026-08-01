import type { Exercise } from "@/types";

export interface SelectExercisesParams {
  tags: string[];
  lastSessionIds?: string[];
  catalog: Exercise[];
}

export const DEFAULT_CATALOG: Exercise[] = [
  {
    id: "default-eyes-1",
    name: "Zasada 20-20-20",
    description:
      "Co 20 minut spójrz na obiekt oddalony o 6 metrów przez 20 sekund. Pozwala to rozluźnić mięśnie rzęskowe oka i zapobiega zmęczeniu wzroku.",
    duration_seconds: 60,
    body_areas: ["eyes"],
  },
  {
    id: "default-eyes-2",
    name: "Palming (ogrzewanie dłońmi)",
    description:
      "Potrzyj dłonie o siebie, aby je rozgrzać, a następnie delikatnie przyłóż je do zamkniętych oczu. Ciepło dłoni i ciemność głęboko relaksują oczy.",
    duration_seconds: 60,
    body_areas: ["eyes"],
  },
  {
    id: "default-neck-1",
    name: "Powolne krążenie szyi",
    description:
      "Delikatnie opuść podbródek do klatki piersiowej i powoli zataczaj głową półokręgi od jednego ramienia do drugiego. Nie odchylaj głowy mocno w tył.",
    duration_seconds: 60,
    body_areas: ["neck", "shoulders"],
  },
  {
    id: "default-neck-2",
    name: "Cofanie podbródka (Chin Tucks)",
    description:
      "Siedząc prosto, delikatnie cofnij podbródek w stronę szyi, tworząc podwójny podbródek. Wytrzymaj 5 sekund i rozluźnij. Powtórz 8 razy dla odciążenia karku.",
    duration_seconds: 45,
    body_areas: ["neck"],
  },
  {
    id: "default-shoulders-1",
    name: "Krążenie barków w tył",
    description:
      "Unieś oba barki wysoko w stronę uszu, odciągnij je maksymalnie w tył, ściągając łopatki, i opuść w dół. Wykonaj 12 płynnych, spokojnych powtórzeń.",
    duration_seconds: 45,
    body_areas: ["shoulders"],
  },
  {
    id: "default-lowerback-1",
    name: "Skręt tułowia na krześle",
    description:
      "Siedząc prosto z podłogą pod stopami, połóż prawą dłoń na lewym kolanie i delikatnie skręć tułów w lewo. Wytrzymaj 25 sekund i zmień stronę.",
    duration_seconds: 60,
    body_areas: ["lower_back"],
  },
  {
    id: "default-general-1",
    name: "Wstanie i przeciągnięcie w górę",
    description:
      "Wstań z krzesła, spleć palce dłoni, odwróć wnętrza dłoni do sufitu i wyciągnij całe ciało mocno w górę. Weź 3 głębokie wdechy, wydłużając kręgosłup.",
    duration_seconds: 45,
    body_areas: ["general"],
  },
];

/**
 * Rule Engine for M4 Exercise Selection.
 * Selects 1-3 exercises from catalog based on tags, applying no-repeat filter
 * and fallback rules to guarantee at least 1 exercise is returned (FR-022).
 */
export function selectExercises(params: SelectExercisesParams): Exercise[] {
  const { tags, lastSessionIds = [], catalog } = params;

  const effectiveCatalog = catalog.length > 0 ? catalog : DEFAULT_CATALOG;

  const isTagMatch = (ex: Exercise, tagList: string[]) => {
    if (tagList.includes("random")) return true;
    return ex.body_areas.some((area) => tagList.includes(area));
  };

  // 1. Filter catalog by tag match
  const candidates = effectiveCatalog.filter((ex) => isTagMatch(ex, tags));

  // 2. Filter out exercises used in the last session (no-repeat rule)
  let freshCandidates = candidates.filter((ex) => !lastSessionIds.includes(ex.id));

  // 3. Fallback logic to guarantee results (FR-022)
  if (freshCandidates.length === 0) {
    if (candidates.length > 0) {
      // Repeat candidates if all matching exercises were in the last session
      freshCandidates = candidates;
    } else {
      // Fallback to 'general' tag
      const generalCandidates = effectiveCatalog.filter((ex) => isTagMatch(ex, ["general"]));
      const freshGeneral = generalCandidates.filter((ex) => !lastSessionIds.includes(ex.id));
      if (freshGeneral.length > 0) {
        freshCandidates = freshGeneral;
      } else if (generalCandidates.length > 0) {
        freshCandidates = generalCandidates;
      } else {
        // Absolute fallback to any exercises in catalog
        freshCandidates = effectiveCatalog;
      }
    }
  }

  // 4. Select 1-3 exercises
  let selected: Exercise[];
  if (freshCandidates.length <= 3) {
    selected = [...freshCandidates];
  } else {
    // Pick 3 randomly
    const shuffled = [...freshCandidates].sort(() => 0.5 - Math.random());
    selected = shuffled.slice(0, 3);
  }

  // 5. Order by duration ascending (shortest first)
  selected.sort((a, b) => a.duration_seconds - b.duration_seconds);

  return selected;
}
