---
change_id: m4-exercise-selection
status: implemented
created: 2026-07-28
owner: solo
type: feature
blocks_certification: true
related_prd_sections:
  - "## Functional Requirements / Exercise Sequence"
  - "## Business Logic / Rule Engine"
related_frs: [FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022]
---

# Milestone 4: Exercise Selection & Sequence (`m4-exercise-selection`)

> **One-line summary.** Implement the rule engine for selecting 1–3 exercises based on user pain tags and non-repeat history, present them in an interactive sequence page (`/exercise-sequence`), and handle exercise completion/skip actions.

## Key Deliverables

1. **Rule Engine**: `src/lib/rule-engine.ts`
   - Filter catalog exercises matching derived input tags (`eyes`, `neck`, `shoulders`, `lower_back`, `general`).
   - Prevent repeating exercises from recent session history (`FR-019`).
   - Fall back gracefully to `general` catalog if specific tag returns <1 exercise (`FR-022`).
   - Limit sequence to 1–3 exercises.

2. **Exercise Sequence Page**: `src/pages/exercise-sequence.astro` & `src/components/ExerciseSequence.tsx`
   - Read `pomostretch.break_input` cookie.
   - Fetch exercise catalog from Supabase.
   - Present sequence card with countdown timer per exercise, illustration/image, description, and "Done" / "Skip" buttons.
   - Clear cookie and offer "Resume Work" link upon sequence completion.
