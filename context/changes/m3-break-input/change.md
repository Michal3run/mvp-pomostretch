---
change_id: m3-break-input
title: "M3: Break Input Selection"
status: preparing
created: 2026-08-01
updated: 2026-08-01
archived_at: null
---

## Notes
Implements the M3 module: the break input screen where the user selects what hurts (quick picks or free text). The submission is POSTed to `/api/break-input`, tags are derived via a keyword matcher, and the state is stored in a signed cookie `pomostretch.break_input` before redirecting to `/exercise-sequence`. The user can also skip the break.
