# BD Buddy — Architecture

## What it is
Static multi-page web app + Node HTTP backend + Python PDF pipeline.

## Diagram
BDU Portal -> server.js -> Frontend (public/) -> Python PDF (scripts/)

## Endpoints
- POST /api/login
- POST /api/verify-password
- POST /api/rankings
- POST /api/generate-grade-pdf
- GET /verify/<token>

## Script load order (auth pages)
1. theme-toggle.js
2. config.js
3. api.js
4. auth.js
5. store.js
6. ui.js (redefines isLoggedIn, getStudentData, logout)
7. page controller

## Data shape from /api/login
- biography: fullName, studentId, gender, etc.
- registrations: [{ semester, acYear, sgpa, cgpa, status }]
- courses: [{ semester, courses: [{ code, title, grade, credit }] }]
- placement: { results[], criteria[], allStudents[] }
- summary: { totalSemesters, totalCredits, cumulativeGPA }

## BDU placement formula
placement_score = (CGPA / 4.0) * 50
                + (ProgramExam) * 0.30
                + (ESSLCE / 600) * 0.20
                + bonuses (Female +5%, Emerging Region +5%, Handicapped +5%)

## Known structural conflicts
- .bottom-nav in layout.css AND navigation.css
- .spinner in layout.css AND utilities.css
- @keyframes spin in 3 files
- .grade-badge in semester.css AND courses.css
- .gpa-grid in semester.css AND gpa.css
- .back-btn in 3 files
- .course-info in 3 places
- .logout-btn in 3 places

## Credentials flow
Browser -> /api/login -> server.js -> HTTP port 80 -> BDU portal
Not logged, not stored. Transits server memory.
Does NOT go "directly from device" — goes through server.
