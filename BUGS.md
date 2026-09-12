# BD Buddy — Bug List

## CRITICAL (19)
| ID | File | Issue |
|---|---|---|
| I-1 | server.js | Password transits server in plaintext |
| I-2 | server.js | BDU requests over HTTP port 80 |
| I-3 | server.js | /api/login broadcasts all students' data |
| I-4 | server.js | CORS wildcard on every route |
| I-97 | index.html | "Credentials sent directly to BDU" is false |
| I-98 | index.html | Same false claim in footer |
| I-159 | renderer-dashboard.js | 3 wrong IDs -> TypeError on load |
| I-406 | page2.py | Percentage renders as "85.5%%" |
| I-425 | page3.py | Personal contact info in every PDF |
| I-431 | page3.py | "Crypt-Checksum" not implemented |
| I-480 | theme.css | --bg-elevated undefined in light mode |
| I-604 | verify.html | Always shows "verified" — no validation |
| I-624 | about.html | Personal phone, Telegram, email public |
| I-687 | contact.html | Form doesn't submit — false success |
| I-714 | terms.html | Terms contradict app behavior |
| I-741 | README.md | Demo credentials block still public |
| I-743 | README.md | No Python deps mentioned |
| I-746 | README.md | Says credentials go "directly" to BDU |
| I-781 | global | Theme system half-migrated |

## HIGH (~20)
- Hardcoded body colors in layout.css override theme
- .bottom-nav white in dark mode
- Missing DOM guards in controllers
- Duplicate gradeClass implementations
- .grade-A-plus mismatch (CSS vs JS)
- Hardcoded colors in JS-generated HTML
- Global user-select: none

## MEDIUM (~60)
- Duplicate CSS rules
- Missing aria-label attributes
- Empty h1 rules that never match
- Stale roadmap entries
- Missing manifest links

## LOW (~120)
- Cosmetic: spacing, redundant rules, mixed units

## Top 15 files by issue count
server.js 12, theme.css 8, placement.html 8, about.html 7,
page2.py 7, verify.html 6, contact.html 6, README.md 6,
layout.css 5, reset.css 5, gpa.css 5, semester.css 5,
courses.css 5, terms.html 5, page3.py 5

## Status
All issues start as: open

*Last updated: 2026-09-12*
