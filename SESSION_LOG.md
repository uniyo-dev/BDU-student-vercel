# Session Log

Daily log of work on BD Buddy.

## 2026-09-13 — Session 2

### Milestone 4 complete

All 10 batches of Milestone 4 (Structure & Polish) done:

- 4.1–4.6: CSS consolidation (bottom-nav, spinner, mt-4/mb-4, reset, body, back-btn)
- 4.7: Config archived to config-reference/
- 4.8: gradeClass consolidated in ui.js
- 4.9: Page-specific rules moved out of shared CSS
- 4.10: Documentation updated

### Commit

78b3823 — refactor: move page-specific rules out of shared CSS

### What's next

Milestone 5 — Features (offline planner, priorities tab, i18n)

## 2026-09-12 / 2026-09-13 — Session 1

### Milestones completed

- Theme Migration
- Milestone 1 (Truth & Safety) — 10 tasks
- Milestone 2 (Visible Bugs) — 3 fixes
- Milestone 3 (Dead Code Removal)

### Theme system

- New variables.css (light: Royal Blue #2563eb)
- New theme.css (dark: Violet #6D28D9)
- All pages use var(--*) tokens
- All CSS alien colors replaced
- info-pages.css extracted (6 pages)
- splash.css + splash.js rebuilt cleanly

### Verification system

- HMAC-signed serials (no database)
- New endpoints: /api/verify/:serial, /api/serial/new
- verify.js fetches from API
- Old "always verified" behavior removed
- Truthful messaging throughout

### Privacy fixes

- Personal phone removed from all files
- "credentials go directly to BDU" claims corrected
- Contact form now uses mailto
- README credentials block replaced with policy

### Bug fixes

- Global user-select: none removed
- PDF %% bug fixed in page2.py
- .grade-A-plus naming aligned
- .grade-dash added for missing grades
- gradeClass consolidated in ui.js

### Config

- public/js/shared/config.js removed from active code
- config-reference/ created with 307-line canonical config
- Full ELEMENT_IDS_REFERENCE documenting all DOM IDs
- <script src=config.js> removed from 6 pages

### Cleanup

- Dead files removed: app.js, renderer-*.js, splash.css
- Duplicated CSS consolidated
- Dead functions removed from config.js
- sql.js dependency removed

### Commits

87311d2 — chore: clean up session — remove sql.js, add session docs
78b3823 — refactor: move page-specific rules out of shared CSS

Add new entries at the top.
