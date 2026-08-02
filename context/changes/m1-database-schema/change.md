---
change_id: m1-database-schema
status: implemented
created: 2026-08-02
owner: solo
type: horizontal
blocks_certification: true
related_prd_sections:
  - "## Database Schema"
related_frs: []
test_plan_risks: []
---

# Milestone 1: Database Schema & Exercise Catalog

> **One-line summary.** Initialize the Supabase Postgres schema with `exercise` and `break_session` tables, including RLS policies, and seed data for the exercise catalog.

## Implementation Details

- Created `exercise` table with seed data for 4 body-areas (eyes, neck, shoulders, lower_back).
- Created `break_session` table with RLS policies to restrict operations to the authenticated user via `auth.uid() = user_id`.
- This is a horizontal enabler unblocking M4 (exercise selection) and M5 (break history CRUD).
