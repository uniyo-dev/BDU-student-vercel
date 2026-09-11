/**
 * BD Buddy — PDF Download Loader (two-step: password → progress)
 * Step 1: User confirms identity by re-entering their BDU password
 * Step 2: Progress overlay while generating the PDF
 */

(function () {
  'use strict';

  // ============================================================
  // CSS
  // ============================================================
  const css = `
    .bd-pdf-loader {
      position: fixed;
      inset: 0;
      background: rgba(11, 15, 25, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
    }
    .bd-pdf-loader.show {
      opacity: 1;
      pointer-events: auto;
    }
    .bd-pdf-loader-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 32px 32px 28px;
      width: 380px;
      max-width: calc(100vw - 40px);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
      text-align: center;
      transform: scale(0.92) translateY(8px);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .bd-pdf-loader.show .bd-pdf-loader-card {
      transform: scale(1) translateY(0);
    }

    /* ============ Shared visual ============ */
    .bd-pdf-loader-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto 16px;
      border-radius: 14px;
      background: linear-gradient(135deg, #8B5CF6, #4C1D95);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(109, 40, 217, 0.35);
      position: relative;
    }
    .bd-pdf-loader-badge svg {
      width: 30px;
      height: 30px;
      stroke: #FCD34D;
      stroke-width: 2.2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .bd-pdf-loader-title {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 4px;
      letter-spacing: -0.2px;
    }
    .bd-pdf-loader-sub {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    /* ============ Step 1: Password ============ */
    .bd-pdf-loader-input-wrap {
      position: relative;
      margin-bottom: 12px;
      text-align: left;
    }
    .bd-pdf-loader-input {
      width: 100%;
      padding: 12px 42px 12px 44px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      color: #0F172A;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }
    .bd-pdf-loader-input:focus {
      border-color: #6D28D9;
      box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.12);
    }
    .bd-pdf-loader-input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
      width: 20px;
      height: 20px;
    }
    .bd-pdf-loader-input-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bd-pdf-loader-input-toggle:hover {
      color: #6D28D9;
    }

    .bd-pdf-loader-error {
      display: none;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 12px;
      color: #991b1b;
      margin-bottom: 12px;
      text-align: left;
      line-height: 1.4;
    }
    .bd-pdf-loader-error.show { display: block; }

    .bd-pdf-loader-actions {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }
    .bd-pdf-loader-btn {
      flex: 1;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      border: none;
      transition: all 0.2s ease;
    }
    .bd-pdf-loader-btn-primary {
      background: linear-gradient(135deg, #6D28D9, #4C1D95);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
    }
    .bd-pdf-loader-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(109, 40, 217, 0.4);
    }
    .bd-pdf-loader-btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .bd-pdf-loader-btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .bd-pdf-loader-btn-secondary:hover {
      background: #e2e8f0;
    }

    /* ============ Step 2: Progress ============ */
    .bd-pdf-loader-visual {
      position: relative;
      width: 96px;
      height: 96px;
      margin: 0 auto 24px;
    }
    .bd-pdf-loader-badge-lg {
      position: absolute;
      inset: 14px;
      border-radius: 14px;
      background: linear-gradient(135deg, #8B5CF6, #4C1D95);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(109, 40, 217, 0.35);
    }
    .bd-pdf-loader-badge-lg svg {
      width: 34px;
      height: 34px;
      stroke: #FCD34D;
      stroke-width: 2.2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .bd-pdf-loader-spinner {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #6D28D9;
      border-right-color: #6D28D9;
      animation: bd-spin 1s linear infinite;
    }
    .bd-pdf-loader-spinner-ring {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-bottom-color: #FCD34D;
      animation: bd-spin 1.5s linear infinite reverse;
    }
    @keyframes bd-spin { to { transform: rotate(360deg); } }

    .bd-pdf-loader-bar-wrap {
      width: 100%;
      height: 8px;
      background: #f1f5f9;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .bd-pdf-loader-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #6D28D9, #8B5CF6, #FCD34D);
      background-size: 200% 100%;
      border-radius: 999px;
      transition: width 0.4s ease;
      animation: bd-shimmer 2.5s ease infinite;
    }
    @keyframes bd-shimmer {
      0%   { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    .bd-pdf-loader-percent {
      font-size: 12px;
      font-weight: 700;
      color: #6D28D9;
      margin-bottom: 16px;
      font-variant-numeric: tabular-nums;
    }

    /* Success + error states */
    .bd-pdf-loader.success .bd-pdf-loader-spinner,
    .bd-pdf-loader.success .bd-pdf-loader-spinner-ring { display: none; }
    .bd-pdf-loader.success .bd-pdf-loader-badge-lg {
      background: linear-gradient(135deg, #22C55E, #16A34A);
    }
    .bd-pdf-loader.success .bd-pdf-loader-badge-lg svg { stroke: #ffffff; }
    .bd-pdf-loader.success .bd-pdf-loader-percent { color: #16A34A; }

    .bd-pdf-loader.error .bd-pdf-loader-spinner,
    .bd-pdf-loader.error .bd-pdf-loader-spinner-ring { display: none; }
    .bd-pdf-loader.error .bd-pdf-loader-badge-lg {
      background: linear-gradient(135deg, #EC4899, #BE185D);
    }
    .bd-pdf-loader.error .bd-pdf-loader-percent { color: #BE185D; }
  `;

  if (!document.getElementById('bd-pdf-loader-styles')) {
    const style = document.createElement('style');
    style.id = 'bd-pdf-loader-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ============================================================
  // HTML templates
  // ============================================================
  const step1HTML = `
    <div class="bd-pdf-loader-badge">
      <svg viewBox="0 0 24 24">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    </div>
    <div class="bd-pdf-loader-title">Confirm Download</div>
    <div class="bd-pdf-loader-sub">
      For security, re-enter your BDU password to download this report.
    </div>
    <div class="bd-pdf-loader-input-wrap">
      <svg class="bd-pdf-loader-input-icon" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <input type="password" class="bd-pdf-loader-input" data-password
             placeholder="Enter your BDU password" autocomplete="current-password" />
      <button type="button" class="bd-pdf-loader-input-toggle" data-toggle>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
    <div class="bd-pdf-loader-error" data-error></div>
    <div class="bd-pdf-loader-actions">
      <button type="button" class="bd-pdf-loader-btn bd-pdf-loader-btn-secondary" data-cancel>Cancel</button>
      <button type="button" class="bd-pdf-loader-btn bd-pdf-loader-btn-primary" data-submit>Verify & Download</button>
    </div>
  `;

  const step2HTML = `
    <div class="bd-pdf-loader-visual">
      <div class="bd-pdf-loader-spinner"></div>
      <div class="bd-pdf-loader-spinner-ring"></div>
      <div class="bd-pdf-loader-badge-lg">
        <svg viewBox="0 0 24 24">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
    </div>
    <div class="bd-pdf-loader-title">Generating PDF</div>
    <div class="bd-pdf-loader-sub" data-stage>Preparing your report…</div>
    <div class="bd-pdf-loader-bar-wrap">
      <div class="bd-pdf-loader-bar" data-bar></div>
    </div>
    <div class="bd-pdf-loader-percent" data-percent>0%</div>
  `;

  // ============================================================
  // Loader class
  // ============================================================
  function PDFLoader() {
    this.el = null;
    this.card = null;
    this.step = 'password';   // 'password' | 'progress'
    this.attempts = 0;
    this.maxAttempts = 3;
    this.timers = [];
    this.onCancel = null;
    this.onConfirm = null;    // called with password when user submits
  }

  PDFLoader.prototype._clearTimers = function () {
    this.timers.forEach(function (t) { clearTimeout(t); });
    this.timers = [];
  };

  PDFLoader.prototype.mount = function () {
    if (this.el) return;

    this.el = document.createElement('div');
    this.el.className = 'bd-pdf-loader';
    this.card = document.createElement('div');
    this.card.className = 'bd-pdf-loader-card';
    this.el.appendChild(this.card);
    document.body.appendChild(this.el);
  };

  PDFLoader.prototype.show = function () {
    this.mount();
    this.attempts = 0;
    this.el.classList.remove('success', 'error', 'show');
    this.step = 'password';
    this._renderPasswordStep();
    // Small delay so the transform transition animates in
    var self = this;
    setTimeout(function () { self.el.classList.add('show'); }, 10);
  };

  PDFLoader.prototype.hide = function () {
    if (!this.el) return;
    this._clearTimers();
    this.el.classList.remove('show');
  };

  // ---------- Step 1 ----------
  PDFLoader.prototype._renderPasswordStep = function () {
    this.step = 'password';
    this.card.innerHTML = step1HTML;

    const self = this;
    const input = this.card.querySelector('[data-password]');
    const errorBox = this.card.querySelector('[data-error]');
    const submitBtn = this.card.querySelector('[data-submit]');
    const cancelBtn = this.card.querySelector('[data-cancel]');
    const toggleBtn = this.card.querySelector('[data-toggle]');

    // Show/hide password
    toggleBtn.addEventListener('click', function () {
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Cancel
    cancelBtn.addEventListener('click', function () {
      if (typeof self.onCancel === 'function') self.onCancel();
      self.hide();
    });

    // Submit
    function submit() {
      const pwd = input.value;
      if (!pwd) {
        errorBox.textContent = 'Please enter your password.';
        errorBox.classList.add('show');
        input.focus();
        return;
      }

      errorBox.classList.remove('show');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying…';

      if (typeof self.onConfirm === 'function') {
        self.onConfirm(pwd);
      }
    }

    submitBtn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });

    setTimeout(function () { input.focus(); }, 150);
  };

  PDFLoader.prototype.showPasswordError = function (msg) {
    if (this.step !== 'password' || !this.card) return;
    this.attempts += 1;

    const errorBox = this.card.querySelector('[data-error]');
    const submitBtn = this.card.querySelector('[data-submit]');

    if (this.attempts >= this.maxAttempts) {
      errorBox.innerHTML = '<strong>Too many attempts.</strong> Please close and try again later.';
      errorBox.classList.add('show');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Locked';
      return;
    }

    const remaining = this.maxAttempts - this.attempts;
    errorBox.textContent = (msg || 'Incorrect password.') +
      ' ' + remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' remaining.';
    errorBox.classList.add('show');

    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify & Download';

    const input = this.card.querySelector('[data-password]');
    if (input) { input.value = ''; input.focus(); }
  };

  // ---------- Step 2 ----------
  PDFLoader.prototype.goToProgress = function () {
    this.step = 'progress';
    this.card.innerHTML = step2HTML;
    this.setProgress(0, 'Preparing your report…');
  };

  PDFLoader.prototype.setProgress = function (pct, stageText) {
    if (!this.card) return;
    pct = Math.max(0, Math.min(100, pct));

    const bar = this.card.querySelector('[data-bar]');
    const percentEl = this.card.querySelector('[data-percent]');
    const stageEl = this.card.querySelector('[data-stage]');

    if (bar) bar.style.width = pct + '%';
    if (percentEl) percentEl.textContent = Math.round(pct) + '%';
    if (stageText && stageEl) stageEl.textContent = stageText;
  };

  PDFLoader.prototype.startStages = function () {
    const self = this;
    const stages = [
      { at: 400,  pct: 20, text: 'Preparing your data…' },
      { at: 1100, pct: 38, text: 'Fetching report details…' },
      { at: 2000, pct: 55, text: 'Rendering pages…' },
      { at: 3000, pct: 72, text: 'Applying security layers…' },
      { at: 4200, pct: 85, text: 'Adding signatures & stamp…' },
      { at: 5500, pct: 94, text: 'Finalizing document…' },
    ];
    stages.forEach(function (s) {
      const t = setTimeout(function () {
        self.setProgress(s.pct, s.text);
      }, s.at);
      self.timers.push(t);
    });
  };

  PDFLoader.prototype.success = function () {
    const self = this;
    this.setProgress(100, 'Downloaded ✓');
    this.el.classList.add('success');
    const t = setTimeout(function () { self.hide(); }, 1500);
    this.timers.push(t);
  };

  PDFLoader.prototype.error = function (message) {
    const self = this;
    this.setProgress(100, message || 'Generation failed');
    this.el.classList.add('error');
    const t = setTimeout(function () { self.hide(); }, 2500);
    this.timers.push(t);
  };

  // Export
  window.BDPdfLoader = new PDFLoader();
})();
