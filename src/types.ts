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
  kind: "quick-pick" | "free-text";
  value: string;
  tags: string[];
}
