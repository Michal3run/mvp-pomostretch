# Research: Session History CRUD

## Internal Research Findings

- **Database Schema**: The `break_session` table was created via migration `20260715120100_create_break_session_table.sql`. It includes:
  - `id` (uuid)
  - `user_id` (uuid, references `auth.users`)
  - `created_at`, `ended_at` (timestamptz)
  - `input_kind`, `input_value`, `derived_tags`, `selected_exercise_ids`
  - `completed_count`, `skipped_count`, `note`
- **Row Level Security (RLS)**: RLS is fully enabled on `break_session`. Policies allow authenticated users to SELECT, INSERT, UPDATE, and DELETE only their own rows (`auth.uid() = user_id`).
- **Indexes**: There is an index `break_session_user_id_created_at_idx` specifically designed for high-performance history list queries.
- **Middleware / Auth**: `src/middleware.ts` manages auth via Supabase SSR, populating `context.locals.user`. Protected routes are listed in `PROTECTED_ROUTES`.
- **API Structure**: Existing endpoints reside in `src/pages/api/`. Currently, there are no endpoints for managing (fetch/update/delete) historical session data.

## External Research Findings (Astro Form Actions vs API Routes)

- **Astro ecosystem**: Astro recently introduced `astro:actions` for type-safe form handling.
- **Project alignment**: Despite the new standard, the `AGENTS.md` strictly enforces the use of traditional API routes in `src/pages/api/**`, exporting `const prerender = false`, using uppercase HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`), and validating with Zod. Therefore, we must implement standard endpoints instead of `astro:actions` to adhere to project rules.
