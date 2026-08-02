---
change_id: m5-break-history-crud
status: implemented
created: 2026-08-02
owner: solo
type: feature
blocks_certification: true
related_prd_sections:
  - "## Functional Requirements / Break Session History (CRUD)"
  - "## Business Logic"
  - "## Access Control"
related_frs: [FR-023, FR-024, FR-025, FR-026, FR-027]
test_plan_risks: [R-02, R-05, R-13]
---

# Milestone 5: Break History CRUD (`m5-break-history-crud`)

> **One-line summary.** Promote break-session records to a user-owned Supabase Postgres table (`break_session`), expose full CRUD endpoints (`POST`, `GET`, `PATCH`, `DELETE` `/api/session-history`), add a dedicated "Historia przerw" page (`/history`), and integrate automatic background session recording upon break sequence completion.

## Motivation & Requirements

To satisfy domain data management requirements:

- **Create (C)**: When a break exercise sequence ends, a `POST /api/session-history` call saves the session (input type, raw text, derived tags, selected exercise IDs, completed & skipped counts, ended timestamp).
- **Read (R)**: The `/history` page displays the authenticated user's break sessions ordered by `created_at DESC`. `GET /api/session-history` returns JSON.
- **Update (U)**: Users can edit an optional note (up to 500 chars) on any of their past break sessions via `PATCH /api/session-history/[id]`.
- **Delete (D)**: Users can delete their past break sessions via `DELETE /api/session-history/[id]`.
- **Security & RLS**: All queries pass through Supabase RLS (`auth.uid() = user_id`) and endpoint-level auth checking (`context.locals.user`).

## Implementation Details

1. **Endpoints**:
   - `src/pages/api/session-history/index.ts`: Gated `GET` (list user's break sessions) and `POST` (create break session with Zod validation).
   - `src/pages/api/session-history/[id].ts`: Gated `PATCH` (update note/counts) and `DELETE` (remove session row).

2. **UI & Navigation**:
   - `src/pages/history.astro`: Protected page (gated in `src/middleware.ts`).
   - `src/components/HistoryList.tsx`: React island providing interactive list view, inline note editor, and delete confirmation.
   - `src/components/Topbar.astro`: Added "Historia" navigation link.

3. **Exercise Sequence Integration**:
   - `src/components/ExerciseSequence.tsx`: Updated `finishSequence` to POST complete break session payload including exercise IDs, completed/skipped metrics, and timestamps.
