# BD Buddy — Architecture

## What it is

Unofficial, student-built viewer for the Bahir Dar University student
portal. Static multi-page web app + Node HTTP backend + Python PDF
pipeline.

## Diagram

BDU Portal -> server.js -> Frontend (public/) -> Python PDF (scripts/)

## Endpoints

- POST /api/login
- POST /api/verify-password
- POST /api/rankings
- POST /api/generate-grade-pdf
- GET  /api/serial/new
- GET  /api/verify/:serial
- GET  /verify/:token

## Script load order (auth pages)

1. theme-toggle.js
2. splash.js (index only)
3. api.js
4. auth.js
5. store.js
6. ui.js (defines getStudentData, isLoggedIn, logout)
7. page controller

Note: config.js no longer exists. Archived at config-reference/config.js

## Data shape from /api/login

- biography: fullName, studentId, gender, birthDate, nationality, phone, email, enrollmentDate, highSchoolStream
- program: string
- registrations: [{ semester, acYear, sgpa, cgpa, status }]
- courses: [{ semester, acYear, courses: [{ code, title, grade, credit, points, percentage }] }]
- placement: { results[], criteria[], allStudents[] }
- summary: { totalSemesters, totalCredits, cumulativeGPA, gradeBreakdown, rankScore }

## BDU placement formula

placement_score = (CGPA / 4.0) * 50
                + (ProgramExam) * 0.30
                + (ESSLCE / 600) * 0.20
                + bonuses (Female +5%, Emerging Region +5%, Handicapped +5%)

Source: public/pages/placement-guide.html

## Verification system (HMAC)

Serial format: BDU-GR-studentId-timestamp36-random-hmacSignature

- Signature: HMAC-SHA256 of studentId|timestamp|random, first 10 chars
- Secret: HMAC_SECRET env var (never committed)
- No database: the signature proves authenticity mathematically
- Verification: server.js recomputes and compares
- Constant-time comparison to prevent timing attacks

## Theme system

Two themes:
- Light -> Royal Blue (#2563eb)
- Dark  -> Violet (#6D28D9)

Files:
- css/shared/variables.css — light theme tokens (default)
- css/shared/theme.css — dark overrides + shared toggle button
- Page CSS files use var(--*) tokens only

Toggle flow:
1. theme-toggle.js reads localStorage.bd_theme
2. Sets data-theme="dark" or "light" on html
3. CSS overrides resolve based on the attribute
4. Button icon updates

## CSS architecture

public/css/
- shared/
  - variables.css (light tokens)
  - theme.css (dark tokens + toggle button)
  - reset.css (browser reset)
  - layout.css (page structure, nav, cards)
  - navigation.css (bottom nav)
  - animations.css (keyframes only)
  - utilities.css (helper classes)
  - banner.css (image banner)
  - splash.css (splash screen — index only)
  - info-pages.css (info pages — 6 pages share)
- login/login.css
- dashboard/dashboard.css
- results/semester.css, gpa.css, courses.css
- placement/placement.css
- profile/profile.css
- report/grade-report.css
- info/placement-guide.css, contact.css

## JS architecture

public/js/
- shared/
  - api.js
  - auth.js
  - store.js
  - ui.js
  - theme-toggle.js
  - splash.js (index only)
  - pdf-loader.js (grade-report only)
- login/login-handler.js
- dashboard/dashboard.js
- results/results.js
- placement/placement.js, rankings-controller.js
- profile/profile.js
- report/render-grade-report.js
- contact/contact.js
- verify/verify.js

## Credentials flow

Browser -> POST /api/login -> server.js -> HTTP port 80 -> BDU portal

- Password transits server.js in memory
- Never logged, never stored, never committed
- Discarded after each request
- Documented in SECURITY.md

## Config reference

All configuration values are documented in config-reference/config.js:
app identity, API endpoints, backend routes, URLs, CDN deps,
academic years, grade scale, placement weights, theme, storage keys,
timeouts, serial format, element IDs, feature flags.

Not loaded by the app — reference only.

## Structural notes

No known CSS conflicts. All duplicates consolidated during Milestone 4.

Dead code removed (see DEAD_CODE.md).
