// Dashboard Logic
document.addEventListener('DOMContentLoaded', function () {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  const data = Auth.getStudentData();

  if (!data) {
    window.location.href = '/';
    return;
  }

  const bio = data.biography || {};
  const summary = data.summary || {};

  document.getElementById('dash-name').textContent = bio.fullName || 'Student';
  document.getElementById('dash-student-id').textContent = bio.studentId || '';
  document.getElementById('dash-program-desc').textContent = data.program || '';
  document.getElementById('dash-gpa').textContent = UI.formatGPA(summary.cumulativeGPA);
  document.getElementById('dash-credits').textContent = summary.totalCredits || '0';

  // ─── Placement urgency banner ────────────────────────────────
  renderPlacementBanner(data);
});

// ─── Placement urgency banner ────────────────────────────────
// Reads placement.selectionOptions to determine state (open / closed /
// not-yet-released). Shows days until deadline + computed total score.
function renderPlacementBanner(data) {
  var banner = document.getElementById('dash-placement-banner');
  if (!banner) return;

  var placement = (data && data.placement) || {};
  var selectionOptions = placement.selectionOptions || [];
  var criteria = placement.criteria || [];

  // Compute total score from criteria (same logic as Priorities tab)
  var totalScore = 0;
  var hasScore = false;
  criteria.forEach(function (c) {
    var scored = parseFloat(c.scored);
    var max = parseFloat(c.maximum);
    var pct = parseFloat(c.percent);
    if (!isNaN(scored) && !isNaN(max) && max > 0 && !isNaN(pct) && scored <= max) {
      totalScore += (scored / max) * pct;
      hasScore = true;
    }
  });

  // Determine state: open / closed / not-yet-released
  var now = new Date();
  var earliestStart = null;
  var latestEnd = null;

  selectionOptions.forEach(function (o) {
    if (o.applyStart) {
      var s = new Date(o.applyStart);
      if (!isNaN(s) && (!earliestStart || s < earliestStart)) earliestStart = s;
    }
    if (o.applyEnd) {
      var e = new Date(o.applyEnd);
      if (!isNaN(e) && (!latestEnd || e > latestEnd)) latestEnd = e;
    }
  });

  var title, meta;
  var state = 'pending';

  // New: if the student has already submitted, show submission status
  var submittedCount = (placement.results || []).length;

  if (submittedCount > 0) {
    title = 'You submitted ' + submittedCount + ' choice' + (submittedCount === 1 ? '' : 's');
    var firstStatus = (placement.results[0] || {}).status || 'Not Decided';
    meta = 'Status: ' + firstStatus + ' · Selection closes ' + (latestEnd ? latestEnd.toLocaleDateString() : 'Sep 18, 2026');
    state = 'open';
  } else if (selectionOptions.length === 0) {
    title = 'Not yet released';
    meta = 'BDU will publish your selectable departments soon.';
    state = 'pending';
  } else if (latestEnd && now > latestEnd) {
    title = 'Selection closed';
    meta = 'Closed ' + latestEnd.toLocaleDateString() + '. Check the official portal.';
    state = 'closed';
  } else {
    title = selectionOptions.length + ' departments available';
    state = 'open';
    if (latestEnd) {
      var days = Math.ceil((latestEnd - now) / (1000 * 60 * 60 * 24));
      var hours = Math.ceil((latestEnd - now) / (1000 * 60 * 60));
      if (days <= 0) {
        meta = 'Closes in ' + hours + ' hour' + (hours === 1 ? '' : 's');
      } else {
        meta = 'Closes in ' + days + ' day' + (days === 1 ? '' : 's');
      }
    } else {
      meta = 'Selection is open on the official portal.';
    }
  }

  if (hasScore) {
    meta += '  ·  Your score: ' + totalScore.toFixed(2);
  }

  var titleEl = document.getElementById('dash-placement-title');
  var metaEl = document.getElementById('dash-placement-meta');
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta;

  banner.classList.remove('hidden', 'is-open', 'is-closed', 'is-pending');
  banner.classList.add('is-' + state);
}
