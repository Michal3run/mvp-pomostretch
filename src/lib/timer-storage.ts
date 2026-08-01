import type { TimerState } from "@/types";

const TIMER_STORAGE_KEY = "pomostretch.timer";

export interface GetTimerResult {
  state: TimerState | null;
  isStorageAvailable: boolean;
}

export function getStoredTimer(): GetTimerResult {
  if (typeof window === "undefined") {
    return { state: null, isStorageAvailable: false };
  }

  try {
    const item = window.localStorage.getItem(TIMER_STORAGE_KEY);
    if (!item) {
      return { state: null, isStorageAvailable: true };
    }
    return { state: JSON.parse(item) as TimerState, isStorageAvailable: true };
  } catch (error) {
    console.warn("localStorage is unavailable:", error);
    return { state: null, isStorageAvailable: false };
  }
}

export function saveStoredTimer(state: TimerState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save timer state to localStorage:", error);
  }
}

export function clearStoredTimer(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear timer state from localStorage:", error);
  }
}
