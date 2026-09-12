# BD Buddy — Project State

**Living status document. Update after every completed task.**

---

## Last Updated

2026-09-12 (evening)

## Current Milestone

**Theme Migration — ✅ COMPLETE** (was an unscheduled milestone)

Milestone 1 (Truth & Safety) is **next**.

## Just Completed — Theme Migration

### Infrastructure
- Rewrote `variables.css` — canonical light theme (Royal Blue `#2563eb`)
- Rewrote `theme.css` — canonical dark theme (Violet `#6D28D9`)
- Deleted 3 parallel theme systems (`--brand-*`, `--gr-*`, `--bg-primary` aliases)

### Pages migrated (13)
All HTML files now have **zero inline `<style>`**:
- `index.html` + `login.css` (241 lines)
- `dashboard.html` + `dashboard.css`
- `results.html` (via `semester.css`, `gpa.css`, `courses.css`)
- `profile.html` + `profile.css`
- `placement.html` (853 → 190 lines) + `placement.css` + new `rankings-controller.js`
- `grade-report.html` (1,019 → 236 lines) + `grade-report.css` (780 lines)
- `placement-guide.html` (542 → 265 lines) + `placement-guide.css`
- 6 info pages (`about`, `help`, `contact`, `privacy`, `terms`, `verify`) → new shared `info-pages.css` (816 lines)

### JS files migrated (4)
All hardcoded inline styles replaced with CSS classes:
- `results.js`
- `profile.js`
- `placement.js`
- `render-grade-report.js`

### Files created
- `public/css/shared/info-pages.css` (816 lines)
- `public/css/report/grade-report.css` (780 lines)
- `public/css/info/placement-guide.css` (277 lines)
- `public/js/placement/rankings-controller.js` (438 lines)
- 5 project state documents (this file + AI_CONTEXT, ARCHITECTURE, BUGS, DEAD_CODE)

### Verification passed
- ✅ No inline `<style>` in any HTML
- ✅ All pages load `variables.css` + `theme.css`
- ✅ All CSS files brace-balanced
- ✅ All HTML files under 500 lines
- ✅ All shared JS files pass `node --check`

### Bug fixed mid-session
- Login spinner never stopped — was caused by **service worker intercepting CSS/JS requests**.
  Fix: either unregister SW, or apply the new `sw.js` that only handles navigation fallback
  (pending — confirm if `sw.js` patch was pushed).

## In Progress

- Nothing (theme migration complete)

## Next 3 Tasks — Milestone 1 (Truth & Safety)

1. **Remove personal info from public places**
   - `README.md` — delete "Demo Credentials" block
   - `public/pages/about.html` — remove phone, Telegram, email
   - `public/pages/contact.html` — replace personal cards
   - `scripts/page3.py` — replace hardcoded contact info

2. **Fix false claims in public docs**
   - `public/pages/verify.html` — "Scan verified successfully" is misleading
   - `README.md` — "directly to BDU" is false
   - `public/pages/about.html` — same claim

3. **Add `SECURITY.md`**
   - Explain credential handling honestly
   - Explain what the app does and doesn't do

## Milestones

| # | Name | Status |
|---|---|---|
| 0 | Theme Migration | ✅ Complete |
| 1 | Truth & Safety | 🟡 Starting next |
| 2 | Fix Visible Bugs | ⏳ Pending |
| 3 | Dead Code Removal | ⏳ Pending |
| 4 | Structure & Polish | ⏳ Pending |
| 5 | Features | ⏳ Pending |

## Git commits this session

- `f170595` — theme: complete migration of all pages to unified CSS system (29 files)
- `eda3f11` — theme: replace hardcoded inline styles in JS with CSS classes (8 files)
- (possibly a third commit for sw.js — confirm)

## Known Issue Sources

- `BUGS.md` — all confirmed issues
- `DEAD_CODE.md` — cleanup queue
- `ARCHITECTURE.md` — codebase map

## Key Facts

- **13 pages**, **4 API endpoints**
- **6 shared JS files** load on every auth page
- **8 shared CSS files** + page-specific CSS
- **3-page PDF** pipeline in `scripts/`
- **Two themes**: Light (Royal Blue `#2563eb`), Dark (Violet `#6D28D9`)

## Standing Conventions

- Patch style: idempotent Python heredocs (safe to re-run)
- Commit style: `type: short summary`
- Never log credentials
- Never expose personal contact info
- Every page must load `variables.css` + `theme.css`

---

*Update this file after every completed task or milestone change.*
