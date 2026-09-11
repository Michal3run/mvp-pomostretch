# Final Repo Cleanup — Plan Brief

> Full plan: `context/changes/final-cleanup/plan.md`

## What & Why
Cleaning up the PomoStretch repository before MVP review by removing leftover scripts, prompt files, test artifacts, and ensuring all dependencies and code formatting are up to date.

## Starting Point
The repository contains 10xdevs-specific instruction files (`GITHUB_ISSUES_PROMPT.md`), PowerShell scripts for issue management (`*.ps1`), unused files (`KIRO.md`, `eslint.log`), and test output directories. Dependencies have minor updates available.

## Desired End State
A clean repository containing only the actual MVP source code, tests, and standard configuration files. All code is formatted, linted, and dependencies are updated to their latest compatible versions.

## Scope

**In scope:**
- Deleting leftover `.ps1` workflow scripts
- Deleting leftover markdown prompt/checklist files
- Deleting test output and log directories
- Updating minor/patch dependencies
- Formatting and linting codebase

**Out of scope:**
- Major version dependency updates
- Feature or architecture changes

## Phases at a Glance

| Phase     | What it delivers       | Key risk                  |
| --------- | ---------------------- | ------------------------- |
| 1. Remove Leftover Files | Clean project structure | Accidentally deleting required files |
| 2. Codebase Updates | Updated and linted code | Dependency updates could break things |

**Estimated effort:** ~15 minutes

## Open Risks & Assumptions
- Assuming `mvp-submit-checklist.md` is safe to delete. (Can be kept if preferred).

## Success Criteria (Summary)
- Leftover files and folders no longer exist
- Codebase passes `npm run lint` and `npm run build`
- App starts normally with `npm run dev`
