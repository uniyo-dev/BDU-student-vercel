# BD Buddy — Project State

Living status document.

## Last Updated

2026-09-13

## Current Milestone

Milestone 4 — Structure & Polish — COMPLETE

Next: Milestone 5 — Features

## Milestones Status

| # | Name | Status |
|---|---|---|
| 0 | Theme Migration | Complete |
| 1 | Truth & Safety | Complete |
| 2 | Fix Visible Bugs | Complete |
| 3 | Dead Code Removal | Complete |
| 4 | Structure & Polish | Complete |
| 5 | Features | Pending |

## Milestone 4 — All batches complete

| Batch | Description | Status |
|---|---|---|
| 4.1 | Consolidate .bottom-nav | Done |
| 4.2 | Consolidate .spinner | Done |
| 4.3 | Consolidate .mt-4/.mb-4 | Done |
| 4.4 | Consolidate reset rules | Done |
| 4.5 | Consolidate body styles | Done |
| 4.6 | Consolidate .back-btn | Done |
| 4.7 | Config archive | Done |
| 4.8 | Consolidate gradeClass | Done |
| 4.9 | Move page rules out of shared CSS | Done |
| 4.10 | Update documentation | Done |

## Next 3 Tasks — Milestone 5

1. Offline planner — standalone page, no BDU login
2. Priorities tab — placement score breakdown + simulator
3. Amharic + English toggle — i18n via data-i18n attributes

## Key Facts

- 13 pages, 6 API endpoints
- HMAC verification (no database)
- Two themes: Royal Blue (light) / Violet (dark)
- Zero Node dependencies
- Config reference: config-reference/ (307 lines)

## Standing Conventions

- Patch style: idempotent Python heredocs
- Commit style: type: short summary
- No inline styles/scripts in HTML
- No hardcoded surface colors in CSS
- No new deletions without approval
- Never commit secrets
- Every config value documented in config-reference/

Update after every completed task.
