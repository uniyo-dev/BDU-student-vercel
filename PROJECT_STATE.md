# BD Buddy — Project State

**Living status document.**

---

## Last Updated

2026-09-13

## Current Milestone

**Milestone 4 — Structure & Polish** (in progress)

## Milestones Status

| # | Name | Status |
|---|---|---|
| 0 | Theme Migration | ✅ Complete |
| 1 | Truth & Safety | ✅ Complete |
| 2 | Fix Visible Bugs | ✅ Complete |
| 3 | Dead Code Removal | ✅ Complete |
| 4 | Structure & Polish | 🟡 In progress |
| 5 | Features | ⏳ Pending |

## Just Completed

- Full theme migration
- Milestone 1 (Truth & Safety)
- Milestone 2 (Visible Bugs)
- Milestone 3 (Dead Code Removal)
- Splash screen rebuilt
- HMAC verification system
- Config archived
- Grade class consolidated
- Personal info removed

## In Progress

- Milestone 4 — Structure & Polish
  - 4.9: Move page rules from `theme.css`
  - 4.10: Update docs

## Next 3 Tasks

1. **Batch 4.9** — Move page-specific rules out of `theme.css`
2. **Batch 4.10** — Update README + project docs
3. **Milestone 5** — Feature work

## Key Facts

- **13 pages**, **6 API endpoints**
- **HMAC verification** (no database)
- **Two themes**: Royal Blue (light) / Violet (dark)
- **Config reference**: `config-reference/` (307 lines)

## Standing Conventions

- Patch style: idempotent Python heredocs
- Commit style: `type: short summary`
- No inline styles/scripts in HTML
- No hardcoded surface colors in CSS
- No new deletions without approval
- Never commit secrets
- Every config value documented in `config-reference/`

---

*Update after every completed task.*
