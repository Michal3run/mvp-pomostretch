export interface TimerState {
  startedAt: number;
  durationMs: number;
  extendedMs: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  body_areas: string[];
  created_at?: string;
}

export interface BreakInputCookie {
  kind: "quick_pick" | "free_text";
  value: string;
  tags: string[];
}
