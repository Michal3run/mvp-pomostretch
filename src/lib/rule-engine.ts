import type { Exercise } from "@/types";

export interface SelectExercisesParams {
  tags: string[];
  lastSessionIds?: string[];
  catalog: Exercise[];
}

/**
 * Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled array without mutating the input.
 */
export function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Checks whether an exercise matches any requested tags,
 * handling the special 'random' tag which matches everything.
 */
export function matchesTags(ex: Exercise, tags: readonly string[]): boolean {
  if (tags.includes("random")) return true;
  return ex.body_areas.some((area) => tags.includes(area));
}

/**
 * Resolves candidate exercises using a clean, 5-tier fallback cascade.
 * Eliminates nested if-else ladders and guarantees at least 1 exercise if catalog is non-empty.
 */
export function resolveCandidatesWithFallbacks(params: SelectExercisesParams): Exercise[] {
  const { tags, lastSessionIds = [], catalog } = params;

  if (catalog.length === 0) {
    return [];
  }

  const isRecent = (ex: Exercise) => lastSessionIds.includes(ex.id);
  const matching = catalog.filter((ex) => matchesTags(ex, tags));
  const general = catalog.filter((ex) => matchesTags(ex, ["general"]));

  const cascadeSteps: (() => Exercise[])[] = [
    // 1. Direct tag match excluding exercises from last session
    () => matching.filter((ex) => !isRecent(ex)),
    // 2. Direct tag match allowing repeats if all were used in last session
    () => matching,
    // 3. Fallback to 'general' category excluding last session
    () => general.filter((ex) => !isRecent(ex)),
    // 4. Fallback to 'general' category allowing repeats
    () => general,
    // 5. Ultimate fallback to entire catalog (FR-022)
    () => catalog,
  ];

  for (const step of cascadeSteps) {
    const candidates = step();
    if (candidates.length > 0) {
      return candidates;
    }
  }

  return [];
}

/**
 * Rule Engine for Exercise Selection (M4 / FR-022).
 * Selects 1-3 exercises from catalog based on tags, applying no-repeat filter
 * and fallback cascade, then orders the selection by duration ascending.
 */
export function selectExercises(params: SelectExercisesParams): Exercise[] {
  const candidates = resolveCandidatesWithFallbacks(params);

  if (candidates.length === 0) {
    return [];
  }

  const selected = candidates.length <= 3 ? [...candidates] : fisherYatesShuffle(candidates).slice(0, 3);

  return selected.sort((a, b) => a.duration_seconds - b.duration_seconds);
}
