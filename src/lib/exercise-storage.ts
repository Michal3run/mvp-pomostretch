export interface ExerciseStoredState {
  exerciseIds: string[];
  currentIndex: number;
  status: "active" | "completed" | "idle_break";
  idleEndTime: number | null;
  completedCount: number;
  skippedCount: number;
  savedAt: number;
}

const EXERCISE_STORAGE_KEY = "pomostretch.exercise_state";
const TTL_MS = 30 * 60 * 1000; // 30 minut

export function getStoredExerciseState(): ExerciseStoredState | null {
  if (typeof window === "undefined") return null;

  try {
    const item = window.localStorage.getItem(EXERCISE_STORAGE_KEY);
    if (!item) return null;

    const state = JSON.parse(item) as ExerciseStoredState;

    // Sprawdzanie TTL
    if (Date.now() - state.savedAt > TTL_MS) {
      window.localStorage.removeItem(EXERCISE_STORAGE_KEY);
      return null;
    }

    return state;
  } catch (error) {
    console.warn("Failed to load exercise state from localStorage:", error);
    return null;
  }
}

export function saveStoredExerciseState(state: Omit<ExerciseStoredState, "savedAt">): void {
  if (typeof window === "undefined") return;

  try {
    const fullState: ExerciseStoredState = {
      ...state,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(fullState));
  } catch (error) {
    console.warn("Failed to save exercise state to localStorage:", error);
  }
}

export function clearStoredExerciseState(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(EXERCISE_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear exercise state from localStorage:", error);
  }
}
