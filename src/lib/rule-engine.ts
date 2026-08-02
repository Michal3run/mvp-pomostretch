import type { Exercise } from "@/types";

export interface SelectExercisesParams {
  tags: string[];
  lastSessionIds?: string[];
  catalog: Exercise[];
}

/**
 * Rule Engine for M4 Exercise Selection.
 * Selects 1-3 exercises from catalog based on tags, applying no-repeat filter
 * and fallback rules to guarantee at least 1 exercise is returned (FR-022).
 */
export function selectExercises(params: SelectExercisesParams): Exercise[] {
  const { tags, lastSessionIds = [], catalog } = params;

  if (catalog.length === 0) {
    return [];
  }

  const isTagMatch = (ex: Exercise, tagList: string[]) => {
    if (tagList.includes("random")) return true;
    return ex.body_areas.some((area) => tagList.includes(area));
  };

  // 1. Filter catalog by tag match
  const candidates = catalog.filter((ex) => isTagMatch(ex, tags));

  // 2. Filter out exercises used in the last session (no-repeat rule)
  let freshCandidates = candidates.filter((ex) => !lastSessionIds.includes(ex.id));

  // 3. Fallback logic to guarantee results (FR-022)
  if (freshCandidates.length === 0) {
    if (candidates.length > 0) {
      // Repeat candidates if all matching exercises were in the last session
      freshCandidates = candidates;
    } else {
      // Fallback to 'general' tag
      const generalCandidates = catalog.filter((ex) => isTagMatch(ex, ["general"]));
      const freshGeneral = generalCandidates.filter((ex) => !lastSessionIds.includes(ex.id));
      if (freshGeneral.length > 0) {
        freshCandidates = freshGeneral;
      } else if (generalCandidates.length > 0) {
        freshCandidates = generalCandidates;
      } else {
        // Absolute fallback to any exercises in catalog
        freshCandidates = catalog;
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
