---
change_id: registration-flow-cleanup
status: done
created: 2026-09-11
updated: 2026-09-11
owner: solo
type: fix
blocks_certification: false
related_prd_sections:
  - "## User & Persona"
  - "## Information & Onboarding"
related_frs: [FR-004]
---

# Change: Registration Flow Cleanup & Footer Fix (`registration-flow-cleanup`)

> **One-line summary.** Remove the broken "Zasady" footer link and simplify the post-registration UX to match the current Supabase config (email verification disabled).

## Context & Motivation

Two UX issues were identified during final MVP polish:

1. **Footer "Zasady" link**: The landing page footer contained a "Zasady" link pointing to the GitHub repository URL — not to any actual terms/rules page. This was confusing and served no purpose for end users.

2. **Misleading email confirmation flow**: Supabase email verification was disabled (correct for an MVP to reduce friction), but the post-registration page (`/auth/confirm-email`) still instructed users to check their inbox for a verification email. No email was ever sent, leaving users confused and unable to proceed.

## Key Deliverables

1. **Remove "Zasady" link** from `src/components/Welcome.astro` footer — keep only the GitHub link.
2. **Replace `/auth/confirm-email` with `/auth/success`** — a simple success page saying "Registration successful. You can now sign in with your new account." with a link to `/auth/signin`.
3. **Update signup redirect** in `src/pages/api/auth/signup.ts` — redirect to `/auth/success` instead of `/auth/confirm-email`.

## Scope & Non-Goals

- **In scope**: Footer link removal, success page rename + content rewrite, signup redirect update.
- **Not in scope**: Re-enabling email verification, adding real terms of service, changes to auth logic.

## Risk Assessment

**Risk: Low.** Changes are purely cosmetic/UX. No business logic, database, or auth flow modifications. The redirect target changed but the signup mechanism (`supabase.auth.signUp`) is untouched.

## Implementation Notes (retroactive)

This change was implemented directly (commit `544579c`) without a prior change document. This retroactive doc is created for process compliance with the 10xDevs change management workflow.

### Commit

- `544579cdb066eca0c18a2fbbfd9152ec9dc272a8` — `feat: remove 'Zasady' from footer and update registration success flow`

### Files Modified

| File                                 | Change                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| `src/components/Welcome.astro`       | Removed "Zasady" `<a>` from footer                                  |
| `src/pages/auth/confirm-email.astro` | **Deleted**                                                         |
| `src/pages/auth/success.astro`       | **Created** — clean success message, no email verification mentions |
| `src/pages/api/auth/signup.ts`       | Redirect target changed: `/auth/confirm-email` → `/auth/success`    |
