(function () {
  'use strict';
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  function shouldWrap(sel) {
    if (!sel || sel.tagName !== 'SELECT') return false;
    if (sel.hasAttribute('data-dd-init')) return false;
    return sel.hasAttribute('data-dropdown') || sel.classList.contains('form-select');
  }

  function closeAll() {
    document.querySelectorAll('.bd-dd.is-open').forEach(function (w) {
      w.classList.remove('is-open');
      var t = w.querySelector('.bd-dd-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  function buildWrapper() {
    var wrapper = document.createElement('div');
    wrapper.className = 'bd-dd';
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'bd-dd-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    var label = document.createElement('span');
    label.className = 'bd-dd-label';
    var arrow = document.createElement('span');
    arrow.className = 'bd-dd-arrow';
    arrow.innerHTML = ARROW_SVG;
    trigger.appendChild(label);
    trigger.appendChild(arrow);
    var panel = document.createElement('div');
    panel.className = 'bd-dd-panel';
    panel.setAttribute('role', 'listbox');
    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);
    return { wrapper: wrapper, trigger: trigger, label: label, panel: panel };
  }

  function refreshLabel(sel, labelEl) {
    var opt = sel.options[sel.selectedIndex];
    if (!opt || opt.value === '') {
      labelEl.textContent = opt ? opt.textContent : '';
      labelEl.classList.add('is-placeholder');
    } else {
      labelEl.textContent = opt.textContent;
      labelEl.classList.remove('is-placeholder');
    }
  }

  function refreshPanel(sel, panelEl) {
    panelEl.innerHTML = '';
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bd-dd-option' +
        (i === sel.selectedIndex ? ' is-selected' : '') +
        (opt.value === '' ? ' is-placeholder' : '');
      btn.setAttribute('data-value', opt.value);
      btn.textContent = opt.textContent;
      panelEl.appendChild(btn);
    }
  }

  function positionPanel(wrapper, panel) {
    var trigger = wrapper.querySelector('.bd-dd-trigger');
    if (!trigger) return;
    var rect = trigger.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;
    panel.classList.remove('bd-dd-panel--up');
    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      panel.classList.add('bd-dd-panel--up');
    }
  }

  function openDropdown(wrapper, sel, panel, trigger) {
    closeAll();
    refreshPanel(sel, panel);
    positionPanel(wrapper, panel);
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function wrap(sel) {
    var built = buildWrapper();
    var wrapper = built.wrapper, trigger = built.trigger, label = built.label, panel = built.panel;
    refreshLabel(sel, label);

    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(sel);
    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);
    sel.setAttribute('data-dd-init', '1');

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrapper.classList.contains('is-open')) closeAll();
      else openDropdown(wrapper, sel, panel, trigger);
    });

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('.bd-dd-option');
      if (!btn) return;
      e.stopPropagation();
      sel.value = btn.getAttribute('data-value');
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', true, false);
      sel.dispatchEvent(evt);
      var inputEvt = document.createEvent('HTMLEvents');
      inputEvt.initEvent('input', true, false);
      sel.dispatchEvent(inputEvt);
      refreshLabel(sel, label);
      closeAll();
    });

    sel.addEventListener('change', function () {
      refreshLabel(sel, label);
      if (wrapper.classList.contains('is-open')) refreshPanel(sel, panel);
    });

    trigger.addEventListener('keydown', function (e) {
      var isOpen = wrapper.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { openDropdown(wrapper, sel, panel, trigger); return; }
        var opts = Array.prototype.slice.call(panel.querySelectorAll('.bd-dd-option'));
        var hoverIdx = opts.findIndex(function (o) { return o.classList.contains('is-hover'); });
        var next = e.key === 'ArrowDown'
          ? (hoverIdx < 0 ? 0 : Math.min(hoverIdx + 1, opts.length - 1))
          : (hoverIdx < 0 ? opts.length - 1 : Math.max(hoverIdx - 1, 0));
        opts.forEach(function (o) { o.classList.remove('is-hover'); });
        opts[next].classList.add('is-hover');
        opts[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) openDropdown(wrapper, sel, panel, trigger);
        else {
          var hovered = panel.querySelector('.bd-dd-option.is-hover');
          if (hovered) hovered.click(); else closeAll();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeAll();
      }
    });

    if (sel.disabled) {
      trigger.disabled = true;
      trigger.style.opacity = '0.5';
      trigger.style.cursor = 'not-allowed';
    }
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.bd-dd')) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
  window.addEventListener('resize', closeAll, { passive: true });
  window.addEventListener('scroll', closeAll, { passive: true, capture: true });

  window.BDDropdown = {
    init: function (root) {
      var scope = root || document;
      var selects = scope.querySelectorAll('select');
      var count = 0;
      selects.forEach(function (sel) {
        if (shouldWrap(sel)) { wrap(sel); count++; }
      });
      return count;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.BDDropdown.init();
    });
  } else {
    window.BDDropdown.init();
  }
})();
