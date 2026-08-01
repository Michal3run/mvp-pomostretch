const LAST_SESSION_STORAGE_KEY = "pomostretch.lastSession";

export function getLastSessionIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(LAST_SESSION_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

export function saveLastSessionIds(ids: string[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage write errors (e.g. private browsing mode)
  }
}
