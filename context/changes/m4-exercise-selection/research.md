# Research: M4 Exercise Selection & Sequence

## 1. Cookie `pomostretch.break_input` Format & Handling

In `src/pages/api/break-input.ts`, the cookie is written on form submission (`POST /api/break-input`):

- **Name**: `pomostretch.break_input`
- **Value**: JSON stringified object:
  ```json
  {
    "kind": "quick-pick" | "free-text",
    "value": "Tylko kark",
    "tags": ["neck"]
  }
  ```
- **Cookie Options**:
  - `path`: `"/"`
  - `maxAge`: `300` (5 minutes TTL)
  - `httpOnly`: `true`
  - `secure`: `import.meta.env.PROD`
  - `sameSite`: `"lax"`

### Reading in Astro SSR

In Astro SSR (`src/pages/exercise-sequence.astro` with `export const prerender = false`):

- `Astro.cookies.get("pomostretch.break_input")` returns an `AstroCookie` object or `undefined`.
- Calling `cookie.json()` returns the parsed `{ kind, value, tags }` object.
- If cookie is missing or invalid, the page must redirect to `/break-input?error=...` or `/break-input`.
- To prevent replay of the break session, the cookie can be deleted with `Astro.cookies.delete("pomostretch.break_input", { path: "/" })` or cleared after sequence completion via an API call / client cleanup.

---

## 2. Supabase `exercise` Table Schema & Querying

Defined in `supabase/migrations/20260715120000_create_exercise_table.sql`:

### Table Schema

```sql
CREATE TABLE IF NOT EXISTS public.exercise (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    duration_seconds int NOT NULL CHECK (duration_seconds >= 30 AND duration_seconds <= 120),
    body_areas text[] NOT NULL CHECK (array_length(body_areas, 1) > 0),
    created_at timestamptz DEFAULT now()
);
```

### RLS Policies

- `SELECT`: Allowed for `authenticated` users (`USING (true)`).

### TypeScript Entity Interface

```typescript
export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  body_areas: string[];
  created_at?: string;
}
```

### Querying via Supabase Client

In Astro SSR:

```typescript
import { createClient } from "@/lib/supabase";

const supabase = createClient(Astro.request.headers, Astro.cookies);
const { data: exercises, error } = await supabase.from("exercise").select("*");
```

---

## 3. Pomodoro Timer Integration (Resume Work)

### Timer Architecture (M2)

- **State storage**: `localStorage` under key `pomostretch.timer` defined in `src/lib/timer-storage.ts`:
  ```typescript
  export interface TimerState {
    startedAt: number;
    durationMs: number;
    extendedMs: number;
  }
  ```
- **Helper functions**:
  - `getStoredTimer()`: Reads state from `localStorage.getItem("pomostretch.timer")`.
  - `saveStoredTimer(state)`: Saves state to `localStorage.setItem("pomostretch.timer", JSON.stringify(state))`.
  - `clearStoredTimer()`: Removes key from `localStorage`.

### Resuming Work Flow

When the exercise sequence finishes and the user confirms "Resume work? (Tak)":

1. Call `saveStoredTimer({ startedAt: Date.now(), durationMs: 25 * 60 * 1000, extendedMs: 0 })`.
2. Navigate to `/dashboard` via `window.location.assign("/dashboard")`.
3. `PomodoroTimer.tsx` on `/dashboard` mounts, reads `getStoredTimer()`, detects active state, and starts counting down from 25:00 immediately.

---

## 4. External Research: Astro Cookies & React Islands

- **Astro Cookies API**: `Astro.cookies.get(name)?.json()` is standard in Astro 4/5/6 SSR for JSON cookies.
- **Passing Props to React Islands**:
  - Astro serializes props passed to `<ExerciseSequence client:load breakInput={breakInput} initialCatalog={catalog} />` as JSON.
  - Types are preserved as long as props are JSON-serializable.
