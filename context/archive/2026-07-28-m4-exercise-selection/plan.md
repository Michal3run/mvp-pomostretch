# Plan: M4 Exercise Selection & Sequence

## Contract

**Goal**: Implement M4 (Exercise Selection & Sequence) enabling the user to receive a recommended 1–3 exercise routine based on break input tags, execute them with per-exercise countdown timers, and resume work smoothly on the Pomodoro dashboard (US-01 completion).

## Proposed Changes

### 1. Middleware (`src/middleware.ts`)

- Add `"/exercise-sequence"` to `PROTECTED_ROUTES` array so unauthenticated users are redirected to sign-in.

### 2. Domain Types (`src/types.ts`)

- Export `Exercise` interface matching database schema (`id`, `name`, `description`, `duration_seconds`, `body_areas`, `created_at`).
- Export `BreakInputCookie` interface (`kind`, `value`, `tags`).

### 3. Rule Engine (`src/lib/rule-engine.ts`)

- Implement `selectExercises(params: { tags: string[]; lastSessionIds?: string[]; catalog: Exercise[] }): Exercise[]`:
  1. Filter `catalog` where `body_areas` overlaps with `tags` (or all if `tags` includes `"random"`).
  2. Filter out exercise IDs contained in `lastSessionIds` (no-repeat rule FR-019).
  3. If resulting set is empty, fall back to `tags = ["general"]` and retry without no-repeat restriction if needed (guarantees ≥1 exercise for all inputs, FR-022).
  4. If candidate pool > 3, select 3 distinct exercises randomly.
  5. Sort selected exercises by `duration_seconds` ascending (shortest first).

### 4. Page SSR (`src/pages/exercise-sequence.astro`) & Clear Cookie API (`src/pages/api/clear-break-cookie.ts`)

- Set `export const prerender = false`.
- Read cookie `pomostretch.break_input` using `Astro.cookies.get("pomostretch.break_input")?.json()`.
- If cookie missing or invalid, redirect 303 to `/break-input`.
- Fetch `catalog` from Supabase (`SELECT * FROM exercise`).
- Render `<ExerciseSequence client:load breakInput={breakInput} catalog={catalog} />`.
- Add `POST /api/clear-break-cookie` endpoint (with `prerender = false`) that calls `cookies.delete("pomostretch.break_input", { path: "/" })` to ensure httpOnly cookie is cleared when sequence ends.

### 5. UI Component (`src/components/ExerciseSequence.tsx`)

- Reads `localStorage.getItem("pomostretch.lastSession")` on mount to retrieve `lastSessionIds`.
- Runs `selectExercises` with `catalog`, `breakInput.tags`, and `lastSessionIds`.
- State machine:
  - `ACTIVE`: Displays exercise title, description, badge tags, progress indicator (e.g., "Ćwiczenie 1 z 3"), per-exercise countdown timer (seconds remaining), "Zrobione" button, and "Pomiń" button.
  - Auto-advance on countdown reaching zero (same as clicking "Zrobione").
  - Tracks `completedCount` and `skippedCount` (plus per-exercise status log) to prepare for M5 `break_session` persistence.
  - `COMPLETED`: Screen asking "Resume work?" with "Tak" (Start work) and "Nie" (Return idle) options.
- Actions:
  - On sequence completion, save selected exercise IDs to `localStorage.setItem("pomostretch.lastSession", JSON.stringify(ids))` and call `/api/clear-break-cookie`.
  - On "Tak": Call `saveStoredTimer({ startedAt: Date.now(), durationMs: 25 * 60 * 1000, extendedMs: 0 })` and redirect to `/dashboard`.
  - On "Nie": Redirect to `/dashboard`.

## Verification Plan

### Automated Tests / Lint

- Run `npm run lint` and `npm run build` to verify TypeScript types, ESLint, and Astro SSR build.
- Write unit tests for `selectExercises` in `src/lib/rule-engine.test.ts` to test:
  - Tag filtering for eyes/neck/shoulders/lower_back/general/random.
  - Exclude previous session exercise IDs (no-repeat).
  - Fallback mechanism to ensure all inputs yield ≥1 exercise.

### End-to-End Walkthrough

1. Go to `/dashboard` -> click "Zakończ" or wait for 25 min -> lands on `/break-input`.
2. Choose "Tylko kark" -> redirected to `/exercise-sequence`.
3. Complete or skip 1-3 exercises -> view "Resume work?" prompt.
4. Click "Tak" -> redirected to `/dashboard` with 25:00 active Pomodoro timer automatically running!
