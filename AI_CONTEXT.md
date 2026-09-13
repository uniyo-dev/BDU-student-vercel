# BD Buddy — AI Session Context

Paste this at the start of any new chat.

## TL;DR

Unofficial BDU student portal viewer.

- Backend: Node HTTP server (server.js), zero deps
- Frontend: vanilla JS, modern CSS, no framework
- PDF: Python + ReportLab
- Verification: HMAC-signed serials (no database)
- Hosted: Render

## Current phase

Milestone 5 — Features (starting)

Milestones 0-4 are complete:
- Theme Migration
- Truth & Safety
- Visible Bugs
- Dead Code Removal
- Structure & Polish

## What's next — Milestone 5

1. Offline planner — standalone page, no BDU login
   - Inputs: stream, GPA, ESSLCE, program exam
   - Computes placement score using BDU's 50/30/20 formula
   - Shows eligible departments
   - Drag-and-drop choice builder
   - Copy-to-clipboard for official portal

2. Priorities tab — new tab in placement page
   - Result card
   - Score breakdown per criterion
   - Priority simulator ("what if I ordered differently?")

3. Amharic + English toggle — data-i18n attributes

## What to read next

1. PROJECT_STATE.md
2. SESSION_LOG.md
3. ARCHITECTURE.md
4. config-reference/

## Workflow

1. Propose
2. Approve
3. Patch
4. Run
5. Verify
6. Move on

## Conventions

- Patches: Termux-safe Python 3 heredocs
- No inline style/script in HTML
- No hardcoded surface colors in CSS
- No new deletions without approval
- Never commit secrets
- Everything documented in config-reference/

## Role

Assistant = technical lead (designs + writes patches)
User = hands (runs, pushes, deploys, approves)

## Key links

- Repo: https://github.com/uniyo-dev/BDU-student-vercel
- Live: https://bdu-portal.onrender.com

Last updated: 2026-09-13 (Milestone 4 complete, starting Milestone 5)
