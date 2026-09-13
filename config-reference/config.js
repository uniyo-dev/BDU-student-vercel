/**
 * BD Buddy — Configuration Reference
 *
 * ARCHIVED: This file is NOT loaded by the app.
 * It documents every configuration value the app uses or could use.
 *
 * The app currently hardcodes these values in its pages and scripts.
 * To use this file in the future:
 *   1. Copy to public/js/shared/config.js
 *   2. Add <script src="/js/shared/config.js"></script> to pages
 *   3. Reference values via CONFIG.<key>
 *
 * Last verified: 2026-09-13 (audit against live code)
 */

const CONFIG = {
  // ---------------- App identity ----------------
  APP_NAME: 'BD Buddy',
  APP_FULL_NAME: 'BDU Student Portal Viewer',
  APP_TAGLINE: 'Your BDU Academic Companion',
  APP_VERSION: '3.0.0',
  UNIVERSITY: 'Bahir Dar University',
  UNIVERSITY_SHORT: 'BDU',
  UNIVERSITY_PORTAL_NAME: 'BDU Portal',
  UNIVERSITY_PORTAL_FULL: 'BDU Student Portal',

  // ---------------- API ----------------
  API_BASE: '/api',
  ENDPOINTS: {
    login: '/api/login',
    rankings: '/api/rankings',
    verifyPassword: '/api/verify-password',
    generatePdf: '/api/generate-grade-pdf',
    verifySerial: '/api/verify',
    newSerial: '/api/serial/new',
  },

  // ---------------- Backend routes (server.js) ----------------
  // Mirrors the frontend endpoints but documents what the backend serves.
  SERVER_ROUTES: {
    login: { method: 'POST', path: '/api/login' },
    rankings: { method: 'POST', path: '/api/rankings' },
    verifyPassword: { method: 'POST', path: '/api/verify-password' },
    generatePdf: { method: 'POST', path: '/api/generate-grade-pdf' },
    newSerial: { method: 'GET', path: '/api/serial/new' },
    verifySerial: { method: 'GET', path: '/api/verify/:serial' },
    verifyPage: { method: 'GET', path: '/verify/:serial', serves: 'verify.html' },
  },

  // ---------------- External URLs ----------------
  URLS: {
    officialPortal: 'https://studentportal.bdu.edu.et',
    githubRepo: 'https://github.com/uniyo-dev/BDU-student-vercel',
    verifyBase: 'https://bdu-portal.onrender.com/verify',
    developerTelegram: 'https://t.me/challengepr',
    renderPrivacy: 'https://render.com/privacy',
  },

  // ---------------- CDN dependencies (deferred) ----------------
  CDN: {
    qrcode: 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
    jsbarcode: 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js',
    googleFonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    googleFontsPreconnect: 'https://fonts.googleapis.com',
    googleFontsStatic: 'https://fonts.gstatic.com',
  },

  // ---------------- Academics ----------------
  ACADEMIC_YEAR: '2025/2026',
  ACADEMIC_YEAR_EC: '2019 E.C.',
  PLACEMENT_RELEASE: 'Meskerem 5-8, 2019 E.C.',
  SUPPORTED_SEMESTERS: ['I', 'II'],
  GRADE_SCALE: {
    'A+': 4.00, 'A': 4.00, 'A-': 3.75,
    'B+': 3.50, 'B': 3.00, 'B-': 2.75,
    'C+': 2.50, 'C': 2.00, 'C-': 1.75,
    'D': 1.00, 'F': 0.00,
  },
  PLACEMENT_WEIGHTS: {
    cgpa: 0.50,
    programExam: 0.30,
    esslce: 0.20,
    bonuses: {
      female: 0.05,
      emergingRegion: 0.05,
      handicapped: 0.05,
    },
  },

  // ---------------- PDF pipeline (scripts/shared.py) ----------------
  // Constants live in scripts/shared.py, documented here for reference:
  PDF: {
    pageSize: 'A4',
    margins: '10mm',
    pageCount: 3,
    stages: ['Cover', 'Grades', 'Grading Key'],
  },

  // ---------------- Theme ----------------
  THEMES: ['light', 'dark'],
  DEFAULT_THEME: 'dark',
  THEME_STORAGE_KEY: 'bd_theme',
  THEME_TOGGLE_ID: 'bd-theme-toggle',
  THEME_ATTR: 'data-theme',

  // ---------------- Storage keys ----------------
  STORAGE_KEYS: {
    loggedIn: 'bdu_logged_in',
    username: 'bdu_username',
    studentData: 'bdu_student_data',
    reportSerialPrefix: 'bdu_report_serial_',
  },
  STORAGE_TYPE: 'sessionStorage',  // where session keys live

  // ---------------- Limits & timeouts ----------------
  TIMEOUTS: {
    apiRequestMs: 90000,
    splashDurationMs: 800,
    passwordVerifyMs: 30000,
    bduPortalMs: 15000,      // server.js upstream
  },
  PAGINATION: {
    studentsPerPage: 20,
    leaderboardTop: 10,
  },

  // ---------------- Verification ----------------
  SERIAL: {
    prefix: 'BDU-GR',
    signatureAlgorithm: 'HMAC-SHA256',
    signatureLength: 10,
    validityDays: null,      // null = no expiry (HMAC-based)
  },

  // ---------------- Element ID reference (documentation only) ----------------
  // IDs are the contract between HTML and JS. If you rename one, update it
  // in BOTH the HTML file and every JS file that uses getElementById().
  //
  // Format: 'HTML file': [IDs defined in that file]
  //         Each ID is prefixed with # for clarity, and tagged [JS] if
  //         referenced by JavaScript.
  //
  // ⚠️  KNOWN ISSUES:
  //     - #btn-copy-choices: referenced in rankings-controller.js but NOT
  //       defined in any HTML. The CopyChoices handler is dead.
  //     - #loading-overlay: referenced in ui.js but not defined in any
  //       HTML. showLoading/hideLoading do nothing.
  ELEMENT_IDS_REFERENCE: {
    // Login page
    'public/index.html': {
      defined: [
        '#aboutModal', '#bd-theme-toggle', '#eye-hide', '#eye-show',
        '#forgot-password-info', '#login-btn', '#login-btn-spinner',
        '#login-btn-text', '#login-error', '#login-error-msg',
        '#login-form', '#login-password', '#login-username',
        '#page-login', '#toggle-password', '#whatsNewBox',
      ],
      usedByJS: [
        '#eye-hide', '#eye-show', '#login-btn', '#login-btn-spinner',
        '#login-btn-text', '#login-error', '#login-error-msg',
        '#login-form', '#login-password', '#login-username',
      ],
    },

    // Main app pages
    'public/pages/dashboard.html': {
      defined: [
        '#bd-theme-toggle', '#dash-credits', '#dash-gpa', '#dash-name',
        '#dash-program-desc', '#dash-student-id', '#page-dashboard',
      ],
      usedByJS: [
        '#dash-credits', '#dash-gpa', '#dash-name',
        '#dash-program-desc', '#dash-student-id',
      ],
    },
    'public/pages/results.html': {
      defined: [
        '#bd-theme-toggle', '#page-results', '#results-content',
        '#semester-toggle',
      ],
      usedByJS: ['#results-content', '#semester-toggle'],
    },
    'public/pages/placement.html': {
      defined: [
        '#btn-refresh', '#criteria-section', '#dept-tabs',
        '#depts-content', '#leaderboard-section', '#page-departments',
        '#pagination', '#position-section', '#priority-section',
        '#rank-modal-actions', '#rank-modal-error',
        '#rank-modal-eye-hide', '#rank-modal-eye-show',
        '#rank-modal-input-wrap', '#rank-modal-password',
        '#rank-modal-spinner', '#rank-modal-sub', '#rank-modal-submit',
        '#rank-modal-success', '#rank-modal-title', '#ranking-modal',
        '#search-input', '#stats-bar', '#tab-departments', '#tab-rankings',
      ],
      usedByJS: [
        '#btn-refresh', '#criteria-section', '#dept-tabs',
        '#depts-content', '#leaderboard-section', '#pagination',
        '#position-section', '#priority-section',
        '#rank-modal-actions', '#rank-modal-error',
        '#rank-modal-eye-hide', '#rank-modal-eye-show',
        '#rank-modal-input-wrap', '#rank-modal-password',
        '#rank-modal-spinner', '#rank-modal-sub', '#rank-modal-success',
        '#rank-modal-title', '#ranking-modal',
        '#search-input', '#stats-bar', '#tab-departments', '#tab-rankings',
      ],
      missingFromHTML: [
        '#btn-copy-choices', // ⚠️ used by rankings-controller.js but not defined
      ],
    },
    'public/pages/profile.html': {
      defined: [
        '#bd-theme-toggle', '#page-profile', '#profile-avatar-initials',
        '#profile-content', '#profile-name', '#profile-student-id',
      ],
      usedByJS: [
        '#profile-avatar-initials', '#profile-content',
        '#profile-name', '#profile-student-id',
      ],
    },
    'public/pages/grade-report.html': {
      defined: [
        '#academic-status', '#barcode-svg', '#bd-theme-toggle',
        '#btn-print', '#btn-print-sticky', '#cgpa-bar', '#cgpa-val',
        '#course-list', '#pill-program', '#pill-semester', '#pill-year',
        '#print-date', '#qr-code', '#serial-text', '#sgpa-bar',
        '#sgpa-val', '#sticky-dl', '#sticky-sub', '#sticky-title',
        '#student-id', '#student-name', '#total-courses',
        '#total-credits', '#verify-url',
      ],
      usedByJS: [
        '#academic-status', '#barcode-svg', '#btn-print',
        '#btn-print-sticky', '#cgpa-bar', '#cgpa-val', '#course-list',
        '#pill-program', '#pill-semester', '#pill-year', '#print-date',
        '#qr-code', '#serial-text', '#sgpa-bar', '#sgpa-val',
        '#sticky-dl', '#student-id', '#student-name', '#total-courses',
        '#total-credits', '#verify-url',
      ],
      dynamicallyCreated: ['#course-toggle'],
    },

    // Info pages
    'public/pages/contact.html': {
      defined: [
        '#bd-theme-toggle', '#category', '#contactForm', '#email',
        '#message', '#name', '#resetFormBtn', '#subject', '#successMsg',
      ],
      usedByJS: [
        '#category', '#contactForm', '#email', '#message',
        '#name', '#resetFormBtn', '#subject', '#successMsg',
      ],
    },
    'public/pages/help.html': {
      defined: ['#bd-theme-toggle', '#searchInput'],
      usedByJS: ['#searchInput'],
    },
    'public/pages/verify.html': {
      defined: [
        '#bd-theme-toggle', '#icon-wrap', '#info-box', '#scanned-time',
        '#token-value', '#verify-card', '#verify-subtitle', '#verify-title',
      ],
      usedByJS: [
        '#icon-wrap', '#info-box', '#scanned-time', '#token-value',
        '#verify-card', '#verify-subtitle', '#verify-title',
      ],
    },
    'public/pages/about.html': {
      defined: ['#bd-theme-toggle', '#bdGrad'],
      usedByJS: [],
    },
    'public/pages/privacy.html': {
      defined: ['#bd-theme-toggle'],
      usedByJS: [],
    },
    'public/pages/terms.html': {
      defined: ['#bd-theme-toggle'],
      usedByJS: [],
    },
    'public/pages/placement-guide.html': {
      defined: [],
      usedByJS: [],
    },

    // Dynamically created by JS (not in any HTML at load time)
    dynamicallyCreated: {
      '#bd-pdf-loader-styles': 'created by pdf-loader.js',
      '#splash-screen': 'created by splash.js',
      '#course-toggle': 'created by render-grade-report.js',
    },

    // ⚠️ Referenced by JS but not defined anywhere
    orphaned: {
      '#loading-overlay': 'referenced by ui.js — showLoading/hideLoading do nothing',
      '#btn-copy-choices': 'referenced by rankings-controller.js — CopyChoices handler is dead',
    },
  },

  // ---------------- Feature flags (future) ----------------
  FEATURES: {
    splashScreen: true,
    darkMode: true,
    pdfDownload: true,
    verification: true,
    offlinePlanner: false,
    amharicToggle: false,
    prioritiesTab: false,
  },
};
