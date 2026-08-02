# Plan: Milestone 5 (Break History CRUD)

## Objective

Deliver complete, end-to-end user-owned Break History CRUD features: API endpoints (`POST`, `GET`, `PATCH`, `DELETE`), protected UI page (`/history`), topbar navigation, and integration with the break exercise sequence flow.

## Implementation Phases

### Phase 1: API Endpoint Completion

- **`src/pages/api/session-history/index.ts`**:
  - Export `const prerender = false`.
  - `GET`: Return list of `break_session` rows for authenticated user.
  - `POST`: Parse request body with Zod `createSessionSchema` and insert into `break_session`.
- **`src/pages/api/session-history/[id].ts`**:
  - `PATCH`: Validate `note` (max 500 chars), `completed_count`, `skipped_count` and update.
  - `DELETE`: Remove session record matching `id` for authenticated user.

### Phase 2: User Interface & Navigation

- **`src/middleware.ts`**: Add `/history` to `PROTECTED_ROUTES`.
- **`src/components/Topbar.astro`**: Add "Historia" navigation link.
- **`src/components/HistoryList.tsx`**: Interactive React island for displaying sessions, editing notes inline, and deleting items.
- **`src/pages/history.astro`**: Astro SSR page fetching initial sessions and rendering layout.

### Phase 3: Integration

- **`src/components/ExerciseSequence.tsx`**: Send complete session payload to `POST /api/session-history` when break sequence completes.

## Progress

- [x] Phase 1: API Endpoints (GET, POST, PATCH, DELETE)
- [x] Phase 2: Protected UI & Navigation (/history page & Topbar link)
- [x] Phase 3: Exercise sequence auto-recording
