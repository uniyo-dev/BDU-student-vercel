# BD Buddy — AI Session Context

**Paste this at the start of any new chat.**

## TL;DR

Unofficial BDU student portal viewer.

- **Backend**: Node HTTP server (`server.js`), no deps
- **Frontend**: vanilla JS, modern CSS
- **PDF**: Python + ReportLab
- **Verification**: HMAC-signed serials
- **Hosted**: Render

## Current phase

**Milestone 4 — Structure & Polish** (in progress)

Milestones 0–3 complete. Milestone 4 has:
- 4.9: Move page rules from `theme.css` (next)
- 4.10: Update docs

## What to read next

1. `PROJECT_STATE.md`
2. `SESSION_LOG.md`
3. `ARCHITECTURE.md`
4. `BUGS.md`
5. `config-reference/` — canonical config

## Workflow

1. Propose 2. Approve 3. Patch 4. Run 5. Verify 6. Move on

## Conventions

- Patches: Termux-safe Python 3 heredocs
- No inline `<style>` or `<script>` in HTML
- No hardcoded colors in CSS
- No new deletions without approval
- Never commit secrets
- Everything documented in `config-reference/`

## Role

**Assistant** = technical lead (designs + writes patches).
**User** = hands (runs, pushes, deploys, approves).

## Key links

- Repo: `https://github.com/uniyo-dev/BDU-student-vercel`
- Live: `https://bdu-portal.onrender.com`

---

*Last updated: 2026-09-13*
