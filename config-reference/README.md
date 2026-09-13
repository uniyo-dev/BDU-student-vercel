# Config Reference

This folder contains a **reference** version of `config.js` that is
**not loaded by the app**. It documents every configuration value the
app uses or could use, in a single canonical location.

## Why is it here?

BD Buddy's configuration values are currently **hardcoded** throughout
the HTML pages and JavaScript files. This reference documents the same
values in one place for:

- **Consistency**: single source of truth for values
- **Onboarding**: new contributors see all config at a glance
- **Future**: ready to be wired up if the app adopts centralized config

## Current state

- The app does **not** load this file
- The app does **not** reference `CONFIG.*` anywhere
- All configuration lives in the code itself

## What's documented

| Section | Contents |
|---|---|
| **App identity** | Name, tagline, version, university names |
| **API** | Base URL and all endpoint paths |
| **URLs** | Official portal, GitHub, verify base, developer contact |
| **CDN** | Deferred JS libraries (qrcode, jsbarcode) and fonts |
| **Academics** | Academic year, placement release, grade scale, placement formula |
| **Theme** | Theme names, storage key, toggle element id |
| **Storage** | All sessionStorage/localStorage keys |
| **Limits** | API timeouts, pagination sizes, upstream timeouts |
| **Verification** | HMAC algorithm, serial prefix, signature length |
| **Feature flags** | What's shipped, what's planned |
| **Element ID reference** | All DOM IDs defined in HTML and used by JS |

## Future use

If BD Buddy ever adopts centralized configuration:

1. Copy `config.js` to `public/js/shared/config.js`
2. Add `<script src="/js/shared/config.js"></script>` to each page
3. Replace hardcoded values with `CONFIG.<key>` references
4. Delete this reference folder

## Audit trail

- **2026-09-13**: Audited against live code. Confirmed all values present in code are reflected here.

## Not included

- **Server-side secrets**: `HMAC_SECRET` is set via environment variable
- **BDU portal HTML scraping patterns**: those live in `server.js`
- **User credentials**: never stored, never config

## Element ID reference

The `ELEMENT_IDS_REFERENCE` section documents every DOM id used by
BD Buddy. It serves as the contract between HTML and JavaScript:

- **HTML files** define elements with `id="..."` attributes
- **JavaScript files** find those elements with `document.getElementById('...')`
- If you **rename an ID**, update it in BOTH places

### Known orphans

Two IDs are referenced in JavaScript but **not defined** in any HTML:

- `#btn-copy-choices` — the `CopyChoices` handler is dead
- `#loading-overlay` — `showLoading`/`hideLoading` do nothing

These are documented in the `orphaned` sub-section of the reference.
They are **not bugs that break the app**, but they are dead code paths.
