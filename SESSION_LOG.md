# Session Log

Daily log of work on BD Buddy. Each entry records what was accomplished
and what's next.

---

## 2026-09-12 / 2026-09-13

### Milestones completed

- ✅ **Theme Migration** — all pages use canonical tokens
- ✅ **Milestone 1 (Truth & Safety)** — 10 tasks complete
- ✅ **Milestone 2 (Visible Bugs)** — 3 remaining bugs fixed
- ✅ **Milestone 3 (Dead Code Removal & CSS Cleanup)**
- 🟡 **Milestone 4 (Structure & Polish)** — in progress

### Theme system

- New canonical `variables.css` (light — Royal Blue `#2563eb`)
- New canonical `theme.css` (dark — Violet `#6D28D9`)
- All pages migrated to use `var(--*)`
- `info-pages.css` created (6 pages)
- `splash.css` + `splash.js` rebuilt cleanly
- All CSS alien colors replaced

### Verification system

- HMAC-signed serials (no database)
- New endpoints: `/api/verify/:serial`, `/api/serial/new`
- `verify.js` fetches from API
- Old "always verified" behavior removed
- Truthful messaging

### Privacy fixes

- Personal phone removed from all files
- "credentials go directly to BDU" claims corrected
- Contact form now uses `mailto:`
- README credentials block → policy

### Bug fixes

- Global `user-select: none` removed
- PDF `%%` bug fixed
- `.grade-A-plus` naming aligned
- `.grade-dash` added for missing grades
- `gradeClass` consolidated in `ui.js`

### Config

- `public/js/shared/config.js` removed from active code
- `config-reference/` with 307-line complete canonical config
- Full `ELEMENT_IDS_REFERENCE`
- Removed `<script src=config.js>` from 6 pages

### Cleanup

- Dead files removed: `app.js`, `renderer-*.js`, `splash.css`
- Duplicated CSS consolidated
- Dead functions removed from `config.js`

### What's next

**Milestone 4 — Structure & Polish**
- Batch 4.9: Move page rules out of `theme.css`
- Batch 4.10: Update docs

**Milestone 5 — Features**
- Offline planner
- Priorities tab
- Amharic toggle
- PWA upgrade

---

*Add new entries at the top.*
