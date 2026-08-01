# Plan: Session History CRUD

## Goal
Implement robust, Zod-validated CRUD API endpoints for managing user break sessions (Session History), adhering to Astro SSR and project-specific RLS conventions.

## Implementation Phases

### Phase 1: Setup Session History List Endpoint (GET)
- **File**: `src/pages/api/session-history/index.ts`
- **Rules**: Export `const prerender = false`.
- **Implementation**: 
  - Export an async `GET` function.
  - Verify `context.locals.user` exists. If not, return JSON `{ error: "Unauthorized" }` with status 401 (preventing HTML redirects from middleware).
  - Instantiate the Supabase client: `const supabase = createClient(context.request.headers, context.cookies)` to ensure cookies/headers are passed for RLS.
  - Use the Supabase client to fetch `break_session` rows for the current user.
  - Order by `created_at` descending (leveraging the existing `break_session_user_id_created_at_idx` index).
  - Return the results as a JSON response.

### Phase 2: Setup Session Management Endpoints (PATCH & DELETE)
- **File**: `src/pages/api/session-history/[id].ts`
- **Rules**: Export `const prerender = false`.
- **Implementation**:
  - Export async `PATCH` and `DELETE` functions.
  - Auth check: Return JSON `{ error: "Unauthorized" }` with status 401 if `context.locals.user` is null.
  - Supabase client: Instantiate via `createClient(context.request.headers, context.cookies)`.
  - **Validation (Zod)**:
    - Validate route parameter `context.params.id` with `z.string().uuid()`.
    - Validate `PATCH` body to match SQL limits: `note` (max 500 chars), `completed_count` (>= 0), `skipped_count` (>= 0).
  - **DELETE**: Execute delete query where `id` matches `params.id`.
  - **PATCH**: Execute update query for provided fields.
  - **Not Found (404)**: For both operations, verify if the query actually modified/deleted a record. If no record was changed (e.g. ID doesn't exist or RLS blocked access), return a 404 Not Found response.
  - **Data Boundaries**: Rely on Supabase RLS policies (`auth.uid() = user_id`) to enforce data boundaries.

### Phase 3: Route Protection & Testing Validation
- Ensure API endpoints strictly return 401 JSON errors (not HTML redirects) when unauthenticated.
- Test endpoints to confirm they return the expected JSON structures and HTTP status codes (200, 400, 401, 404, 500).
