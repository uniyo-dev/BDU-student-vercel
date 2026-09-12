# BD Buddy — Dead Code Inventory

## Entire files (delete after review)
| File | Lines | Reason |
|---|---|---|
| public/js/shared/app.js | ~60 | Never loaded |
| public/js/placement/renderer-placement.js | ~100 | Never loaded |
| public/js/profile/renderer-profile.js | ~110 | Never loaded |
| public/js/results/renderer-results.js | ~120 | Never loaded |
| public/css/dashboard/splash.css | ~40 | Never loaded |
| public/css/report/grade-report.css | ~450 | Never loaded |

## Partial dead code
| File | Section | Reason |
|---|---|---|
| config.js | getStudentData, isLoggedIn, logout | Shadowed by ui.js |
| api.js | loginAndGetData | Never called |
| renderer-dashboard.js | (most) | Throws on load |
| gpa.css | ~90% | Selectors never matched |
| placement.css | First ~130 lines | Old stylesheet |
| banner.css | Splash section | No #splash-screen in HTML |
| animations.css | Stagger + .animate-* | Unused |
| utilities.css | .spinner, .mt-4 | Duplicates |

## CSS rules that never match
- .depts-header h1 (placement.css)
- .results-header h1/p (semester.css)
- .profile-header h1 (profile.css)
- .course-status.* (courses.css)

## Verify before deleting
grep -rln "FILENAME" public --include="*.html"
grep -rn "CLASSNAME" public --include="*.html" --include="*.js"

If grep returns nothing, safe to delete.

*Last updated: 2026-09-12*

## Newly discovered dead assets (2026-09-12)

### public/icons/ — entire folder (189 files, ~58 KB)
No HTML or JS loads /icons/. App uses inline SVGs everywhere.

### public/images/ dead SVG logos (4 files)
bd-buddy-logo.svg, bd-buddy-icon.svg, bd-buddy-avatar.svg, bd-buddy-mark.svg
Never loaded. Manifest points to PNG variants, not these SVGs.

### public/images/ dead launcher icons (2 files)
launchericon-192x192.png, launchericon-512x512.png
Never loaded. Manifest points to bd-buddy-192x192.png and bd-buddy-512x512.png.

### Oversized asset
stamp-official.jpg — 759 KB. Should be compressed to <50 KB.

### Total dead assets
~195 files, ~320 KB. Plus the ~2,500 lines of dead JS/CSS already listed above.
